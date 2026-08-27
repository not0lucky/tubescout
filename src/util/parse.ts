import { TubeScoutError } from "./retry.js";

/** Accepts a bare video ID, watch/shorts/embed URLs, or youtu.be links. */
export function extractVideoId(input: string): string {
  const trimmed = input.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new TubeScoutError(`Not a video ID or URL: "${input}"`, "Pass an 11-char video ID or a youtube.com/youtu.be URL.");
  }
  const v = url.searchParams.get("v");
  if (v && /^[\w-]{11}$/.test(v)) return v;
  const m = url.pathname.match(/^\/(?:shorts\/|embed\/|live\/)?([\w-]{11})(?:$|\/)/);
  if (m) return m[1];
  throw new TubeScoutError(`Could not find a video ID in "${input}"`);
}

/** youtubei.js wraps most strings in Text nodes; unwrap defensively. */
export function textOf(x: unknown): string {
  if (x == null) return "";
  if (typeof x === "string") return x;
  if (typeof x === "number") return String(x);
  const t = x as { text?: unknown; toString?: () => string };
  if (typeof t.text === "string") return t.text;
  try {
    const s = String(x);
    return s === "[object Object]" ? "" : s;
  } catch {
    return "";
  }
}

/** Parse "1,234,567 views" / "1.2M views" style strings into a number when possible. */
export function approxCount(s: string): number | null {
  const m = s.replace(/,/g, "").match(/([\d.]+)\s*([KMB])?/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (Number.isNaN(n)) return null;
  const mult = { K: 1e3, M: 1e6, B: 1e9 }[(m[2] ?? "").toUpperCase() as "K" | "M" | "B"] ?? 1;
  return Math.round(n * mult);
}

/** Collapse whitespace and drop consecutive duplicate lines (auto-captions repeat as they scroll). */
export function cleanTranscriptLines(lines: string[]): string {
  const out: string[] = [];
  for (const raw of lines) {
    const line = raw.replace(/\s+/g, " ").trim();
    if (line && line !== out[out.length - 1]) out.push(line);
  }
  return out.join(" ");
}
