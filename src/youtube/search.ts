import { getClient } from "./client.js";
import { withRetry } from "../util/retry.js";
import { textOf, approxCount } from "../util/parse.js";

export interface SearchFilters {
  uploadDate?: "hour" | "today" | "week" | "month" | "year";
  duration?: "short" | "medium" | "long";
  sortBy?: "relevance" | "upload_date" | "view_count" | "rating";
  maxResults?: number;
}

export interface VideoHit {
  videoId: string;
  title: string;
  channel: string;
  channelId: string | null;
  published: string;
  views: number | null;
  viewsText: string;
  duration: string;
  snippet: string;
  url: string;
}

function toHit(v: any): VideoHit | null {
  const videoId: string | undefined = v?.video_id ?? v?.id;
  if (!videoId || typeof videoId !== "string" || videoId.length !== 11) return null;
  const viewsText =
    textOf(v?.view_count) || textOf(v?.short_view_count) || textOf(v?.metadata?.metadata?.metadata_rows?.[0]?.metadata_parts?.[0]?.text) || "";
  return {
    videoId,
    title: textOf(v?.title) || textOf(v?.metadata?.title),
    channel: textOf(v?.author?.name) || textOf(v?.author),
    channelId: v?.author?.id ?? null,
    published: textOf(v?.published),
    views: viewsText ? approxCount(viewsText) : null,
    viewsText,
    duration: textOf(v?.duration?.text ?? v?.duration ?? v?.length_text),
    snippet: textOf(v?.description_snippet) || textOf(v?.snippets?.[0]?.text),
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

export async function searchVideos(query: string, filters: SearchFilters = {}): Promise<VideoHit[]> {
  const yt = await getClient();
  const max = Math.min(filters.maxResults ?? 15, 50);
  const search = await withRetry(
    () =>
      yt.search(query, {
        type: "video",
        upload_date: filters.uploadDate === "week" ? "week" : filters.uploadDate,
        duration: filters.duration,
        sort_by: filters.sortBy ?? "relevance",
      } as any),
    { label: `search "${query}"` },
  );

  const hits: VideoHit[] = [];
  let page: any = search;
  while (hits.length < max && page) {
    for (const v of page.videos ?? page.results ?? []) {
      const hit = toHit(v);
      if (hit && !hits.some((h) => h.videoId === hit.videoId)) hits.push(hit);
      if (hits.length >= max) break;
    }
    if (hits.length >= max) break;
    try {
      page = page.has_continuation ? await page.getContinuation() : null;
    } catch {
      page = null;
    }
  }
  return hits;
}
