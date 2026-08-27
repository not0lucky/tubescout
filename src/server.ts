import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchVideos } from "./youtube/search.js";
import { getVideo } from "./youtube/video.js";
import { getTranscript } from "./youtube/transcript.js";
import { getChannelVideos, getSearchSuggestions } from "./youtube/channel.js";
import { TubeScoutError, mapConcurrent } from "./util/retry.js";

export const VERSION = "0.1.1";

const MAX_TRANSCRIPT_CHARS = 60_000;

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function fail(err: unknown) {
  const msg = err instanceof TubeScoutError && err.hint ? `${err.message}\nHint: ${err.hint}` : err instanceof Error ? err.message : String(err);
  return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "tubescout", version: VERSION });

  server.registerTool(
    "search_videos",
    {
      title: "Search YouTube videos",
      description:
        "Search YouTube for videos (no API key). Returns id, title, channel, published, views, duration, snippet per hit. Use filters to narrow: uploadDate for recency, sortBy view_count to find what performs.",
      inputSchema: {
        query: z.string().min(1).describe("Search query"),
        maxResults: z.number().int().min(1).max(50).optional().describe("Max hits to return (default 15)"),
        uploadDate: z.enum(["hour", "today", "week", "month", "year"]).optional().describe("Only videos uploaded within this window"),
        duration: z.enum(["short", "medium", "long"]).optional().describe("short <4min, medium 4-20min, long >20min"),
        sortBy: z.enum(["relevance", "upload_date", "view_count", "rating"]).optional().describe("Result ordering (default relevance)"),
      },
    },
    async ({ query, maxResults, uploadDate, duration, sortBy }) => {
      try {
        return ok(await searchVideos(query, { maxResults, uploadDate, duration, sortBy }));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    "get_video",
    {
      title: "Get video intel",
      description:
        "Full metadata + engagement for one video: title, channel, publish date, views, likes, likesPer1kViews (resonance signal, typical range 10-50), category, keywords, description, hasCaptions.",
      inputSchema: {
        video: z.string().describe("Video ID or any YouTube URL (watch, youtu.be, shorts)"),
      },
    },
    async ({ video }) => {
      try {
        return ok(await getVideo(video));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    "get_transcript",
    {
      title: "Get video transcript",
      description:
        "Fetch a video's transcript as clean plain text. Resilient: tries InnerTube, then the timedtext caption track, then local yt-dlp if installed. Long transcripts are chunked — check totalChars and call again with offsetChars to continue.",
      inputSchema: {
        video: z.string().describe("Video ID or any YouTube URL"),
        language: z.string().optional().describe("Preferred caption language code (default 'en')"),
        offsetChars: z.number().int().min(0).optional().describe("Character offset to resume a chunked transcript"),
        maxChars: z.number().int().min(1000).max(MAX_TRANSCRIPT_CHARS).optional().describe(`Chunk size (default ${MAX_TRANSCRIPT_CHARS})`),
      },
    },
    async ({ video, language, offsetChars, maxChars }) => {
      try {
        const t = await getTranscript(video, language ?? "en");
        const offset = offsetChars ?? 0;
        const limit = maxChars ?? MAX_TRANSCRIPT_CHARS;
        const chunk = t.text.slice(offset, offset + limit);
        return ok({
          videoId: t.videoId,
          language: t.language,
          source: t.source,
          wordCount: t.wordCount,
          totalChars: t.text.length,
          offsetChars: offset,
          returnedChars: chunk.length,
          hasMore: offset + chunk.length < t.text.length,
          text: chunk,
        });
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    "get_transcripts",
    {
      title: "Get transcripts for multiple videos",
      description:
        "Batch transcript fetch (max 10 videos, 3 at a time). Per-video failures don't kill the batch — failed entries carry an error field. Each transcript is truncated to fit; use get_transcript with offsetChars for full text of long ones.",
      inputSchema: {
        videos: z.array(z.string()).min(1).max(10).describe("Video IDs or URLs"),
        language: z.string().optional().describe("Preferred caption language code (default 'en')"),
      },
    },
    async ({ videos, language }) => {
      const perVideoBudget = Math.floor(MAX_TRANSCRIPT_CHARS / videos.length);
      const results = await mapConcurrent(
        videos,
        3,
        async (v) => {
          const t = await getTranscript(v, language ?? "en");
          return {
            videoId: t.videoId,
            language: t.language,
            source: t.source,
            wordCount: t.wordCount,
            totalChars: t.text.length,
            truncated: t.text.length > perVideoBudget,
            text: t.text.slice(0, perVideoBudget),
          };
        },
        (v, err) => ({ videoId: v, error: err instanceof Error ? err.message : String(err) }) as any,
      );
      return ok(results);
    },
  );

  server.registerTool(
    "get_channel_videos",
    {
      title: "Scan a channel",
      description:
        "Channel metadata (name, subscribers, description) plus its recent uploads with views — enough to read a channel's strategy, cadence, and what performs.",
      inputSchema: {
        channel: z.string().describe("Channel ID (UC…), @handle, or channel URL"),
        maxVideos: z.number().int().min(1).max(60).optional().describe("How many recent videos to return (default 20)"),
      },
    },
    async ({ channel, maxVideos }) => {
      try {
        return ok(await getChannelVideos(channel, maxVideos ?? 20));
      } catch (err) {
        return fail(err);
      }
    },
  );

  server.registerTool(
    "get_search_suggestions",
    {
      title: "Get YouTube search suggestions",
      description:
        "YouTube's autocomplete for a seed term — a direct read on real search demand. Use for keyword research: seed a niche term, get what people actually type. Chain suggestions of suggestions to map a topic space.",
      inputSchema: {
        query: z.string().min(1).describe("Seed term, e.g. 'stamp identifier' or 'n8n'"),
      },
    },
    async ({ query }) => {
      try {
        return ok(await getSearchSuggestions(query));
      } catch (err) {
        return fail(err);
      }
    },
  );

  return server;
}
