import { getClient } from "./client.js";
import { withRetry } from "../util/retry.js";
import { extractVideoId, textOf } from "../util/parse.js";

export interface VideoIntel {
  videoId: string;
  url: string;
  title: string;
  channel: string;
  channelId: string | null;
  publishDate: string;
  durationSeconds: number | null;
  views: number | null;
  likes: number | null;
  /** likes per 1,000 views — a rough resonance signal (typical YouTube range ~10–50). */
  likesPer1kViews: number | null;
  category: string | null;
  keywords: string[];
  isLive: boolean;
  description: string;
  hasCaptions: boolean;
}

export async function getVideo(input: string): Promise<VideoIntel> {
  const videoId = extractVideoId(input);
  const yt = await getClient();
  const info = await withRetry(() => yt.getInfo(videoId), { label: `getInfo ${videoId}` });

  const b: any = info.basic_info ?? {};
  const views = typeof b.view_count === "number" ? b.view_count : null;
  const likes = typeof b.like_count === "number" ? b.like_count : null;
  const publishDate =
    textOf((info as any).primary_info?.published) || (b.start_timestamp ? String(b.start_timestamp) : "") || "";

  return {
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title: b.title ?? "",
    channel: b.author ?? b.channel?.name ?? "",
    channelId: b.channel_id ?? b.channel?.id ?? null,
    publishDate,
    durationSeconds: typeof b.duration === "number" ? b.duration : null,
    views,
    likes,
    likesPer1kViews: views && likes ? Math.round((likes / views) * 1000 * 10) / 10 : null,
    category: b.category ?? null,
    keywords: Array.isArray(b.keywords) ? b.keywords.slice(0, 25) : [],
    isLive: Boolean(b.is_live),
    description: (b.short_description ?? "").slice(0, 2500),
    hasCaptions: Boolean((info as any).captions?.caption_tracks?.length),
  };
}
