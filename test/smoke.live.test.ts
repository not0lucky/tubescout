// Live smoke tests — hit real YouTube. Run manually before publishing: npm run test:live
// Flaky-tolerant by design: generous timeouts, and the transcript chain's whole job is surviving flakiness.
import { describe, it, expect } from "vitest";
import { searchVideos } from "../src/youtube/search.js";
import { getVideo } from "../src/youtube/video.js";
import { getTranscript } from "../src/youtube/transcript.js";
import { getChannelVideos, getSearchSuggestions } from "../src/youtube/channel.js";

const LONG = 120_000;

describe("live", () => {
  it("searches videos with metadata", { timeout: LONG }, async () => {
    const hits = await searchVideos("n8n automation tutorial", { maxResults: 5 });
    expect(hits.length).toBeGreaterThanOrEqual(3);
    for (const h of hits) {
      expect(h.videoId).toMatch(/^[\w-]{11}$/);
      expect(h.title.length).toBeGreaterThan(0);
    }
  });

  it("gets video intel with engagement fields", { timeout: LONG }, async () => {
    const v = await getVideo("WE5uCp5cS_g");
    expect(v.title).toContain("HTML");
    expect(v.views).toBeGreaterThan(1000);
    expect(v.likesPer1kViews).toBeGreaterThan(0);
  });

  it("fetches a transcript through the fallback chain", { timeout: LONG }, async () => {
    const t = await getTranscript("WE5uCp5cS_g");
    expect(t.wordCount).toBeGreaterThan(1000);
    expect(t.text).toContain("HTML");
    expect(["timedtext", "innertube", "yt-dlp"]).toContain(t.source);
  });

  it("scans a channel with recent uploads", { timeout: LONG }, async () => {
    const ch = await getChannelVideos("@starterstory", 5);
    expect(ch.name.toLowerCase()).toContain("starter");
    expect(ch.recentVideos.length).toBeGreaterThanOrEqual(3);
    expect(ch.recentVideos[0].videoId).toMatch(/^[\w-]{11}$/);
  });

  it("returns search suggestions", { timeout: LONG }, async () => {
    const s = await getSearchSuggestions("stamp identifier");
    expect(s.length).toBeGreaterThan(0);
  });
});
