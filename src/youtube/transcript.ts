import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { getClient } from "./client.js";
import { withRetry, TubeScoutError } from "../util/retry.js";
import { extractVideoId, cleanTranscriptLines } from "../util/parse.js";

const execFileP = promisify(execFile);

export interface Transcript {
  videoId: string;
  language: string;
  source: "innertube" | "timedtext" | "yt-dlp";
  wordCount: number;
  text: string;
}

/**
 * Strategy 2 — youtubei.js getTranscript().
 * Nicely segmented text, but the get_transcript endpoint intermittently 400s, hence retries.
 */
async function viaInnertube(videoId: string): Promise<{ text: string; language: string }> {
  const yt = await getClient();
  const info = await yt.getInfo(videoId);
  const t: any = await info.getTranscript();
  const segments: any[] = t?.transcript?.content?.body?.initial_segments ?? [];
  const lines = segments.map((s) => (typeof s?.snippet?.text === "string" ? s.snippet.text : (s?.snippet?.text?.text ?? ""))).filter(Boolean);
  if (!lines.length) throw new Error("InnerTube returned an empty transcript");
  return { text: cleanTranscriptLines(lines), language: t?.selectedLanguage ?? "unknown" };
}

/**
 * Strategy 1 — the timedtext caption track from the ANDROID player response, fetched as json3.
 * The web client hides caption tracks, but the ANDROID client still serves them with a signed base_url.
 */
async function viaTimedtext(videoId: string, language: string): Promise<{ text: string; language: string }> {
  const yt = await getClient();
  const info: any = await yt.getBasicInfo(videoId, { client: "ANDROID" } as any);
  const tracks: any[] = info?.captions?.caption_tracks ?? [];
  if (!tracks.length) throw new Error("No caption tracks on this video");
  const track =
    tracks.find((t) => t.language_code === language) ??
    tracks.find((t) => String(t.language_code ?? "").startsWith(language)) ??
    tracks[0];
  const url = `${String(track.base_url).replace(/&fmt=\w+/, "")}&fmt=json3`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`timedtext fetch failed: HTTP ${res.status}`);
  const data: any = await res.json();
  const lines = (data.events ?? [])
    .map((e: any) => (e.segs ?? []).map((s: any) => s.utf8 ?? "").join(""))
    .filter((l: string) => l.trim());
  if (!lines.length) throw new Error("timedtext track was empty");
  return { text: cleanTranscriptLines(lines), language: track.language_code ?? language };
}

/**
 * Strategy 3 — local yt-dlp, if installed. Slowest, most resilient.
 * Downloads the auto-sub as json3 into a temp dir and parses it.
 */
async function viaYtDlp(videoId: string, language: string): Promise<{ text: string; language: string }> {
  try {
    await execFileP("yt-dlp", ["--version"]);
  } catch {
    throw new Error("yt-dlp is not installed (optional last-resort fallback)");
  }
  const dir = await mkdtemp(join(tmpdir(), "tubescout-"));
  try {
    await execFileP(
      "yt-dlp",
      ["--skip-download", "--write-auto-subs", "--write-subs", "--sub-langs", `${language}.*,${language}`, "--sub-format", "json3", "-o", join(dir, "sub"), `https://www.youtube.com/watch?v=${videoId}`],
      { timeout: 60_000 },
    );
    const files = (await readdir(dir)).filter((f) => f.endsWith(".json3"));
    if (!files.length) throw new Error("yt-dlp produced no subtitle file");
    const data = JSON.parse(await readFile(join(dir, files[0]), "utf8"));
    const lines = (data.events ?? [])
      .map((e: any) => (e.segs ?? []).map((s: any) => s.utf8 ?? "").join(""))
      .filter((l: string) => l.trim());
    if (!lines.length) throw new Error("yt-dlp subtitle file was empty");
    const langMatch = files[0].match(/sub\.([\w-]+)\.json3/);
    return { text: cleanTranscriptLines(lines), language: langMatch?.[1] ?? language };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function getTranscript(input: string, language = "en"): Promise<Transcript> {
  const videoId = extractVideoId(input);
  const strategies: Array<{ source: Transcript["source"]; attempts: number; fn: () => Promise<{ text: string; language: string }> }> = [
    { source: "timedtext", attempts: 2, fn: () => viaTimedtext(videoId, language) },
    { source: "innertube", attempts: 3, fn: () => viaInnertube(videoId) },
    { source: "yt-dlp", attempts: 1, fn: () => viaYtDlp(videoId, language) },
  ];

  const failures: string[] = [];
  for (const s of strategies) {
    try {
      const { text, language: lang } = await withRetry(s.fn, { attempts: s.attempts, label: `${s.source} transcript ${videoId}` });
      return { videoId, language: lang, source: s.source, wordCount: text.split(/\s+/).length, text };
    } catch (err) {
      failures.push(`${s.source}: ${err instanceof Error ? err.message : err}`);
    }
  }
  throw new TubeScoutError(
    `All transcript strategies failed for ${videoId} — ${failures.join(" | ")}`,
    "The video may have captions disabled, be age/region-gated, or YouTube may be rate-limiting this IP. Try again in a minute.",
  );
}
