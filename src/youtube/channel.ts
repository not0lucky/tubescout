import { getClient } from "./client.js";
import { withRetry, TubeScoutError } from "../util/retry.js";
import { textOf, approxCount } from "../util/parse.js";
import type { VideoHit } from "./search.js";

export interface ChannelIntel {
  channelId: string;
  name: string;
  subscribers: string;
  totalVideosText: string;
  description: string;
  recentVideos: VideoHit[];
}

async function resolveChannelId(input: string): Promise<string> {
  const trimmed = input.trim();
  if (/^UC[\w-]{22}$/.test(trimmed)) return trimmed;
  const yt = await getClient();
  const handle = trimmed.startsWith("@") ? trimmed : trimmed.match(/youtube\.com\/(@[\w.-]+)/)?.[1];
  const idFromUrl = trimmed.match(/youtube\.com\/channel\/(UC[\w-]{22})/)?.[1];
  if (idFromUrl) return idFromUrl;
  if (!handle) throw new TubeScoutError(`Cannot resolve channel from "${input}"`, "Pass a UC… channel ID, an @handle, or a channel URL.");
  const resolved: any = await yt.resolveURL(`https://www.youtube.com/${handle}`);
  const id = resolved?.payload?.browseId;
  if (!id) throw new TubeScoutError(`Could not resolve handle ${handle} to a channel ID`);
  return id;
}

export async function getChannelVideos(input: string, maxVideos = 20): Promise<ChannelIntel> {
  const channelId = await resolveChannelId(input);
  const yt = await getClient();
  const channel: any = await withRetry(() => yt.getChannel(channelId), { label: `getChannel ${channelId}` });

  const meta: any = channel?.metadata ?? {};
  const header: any = channel?.header?.content ?? channel?.header ?? {};
  const videos: VideoHit[] = [];
  const parseFeedItem = (v: any): VideoHit | null => {
    // Newer surfaces use LockupView nodes; older ones use Video nodes.
    if (v?.type === "LockupView" || v?.content_id) {
      const videoId = v?.content_id;
      if (!videoId) return null;
      const parts: string[] = (v?.metadata?.metadata?.metadata_rows ?? [])
        .flatMap((r: any) => r?.metadata_parts ?? [])
        .map((p: any) => textOf(p?.text))
        .filter(Boolean);
      const viewsText = parts.find((p) => /view/i.test(p)) ?? "";
      const published = parts.find((p) => /ago|premier|stream/i.test(p)) ?? "";
      const badges: string[] = (v?.content_image?.overlays ?? []).flatMap((o: any) => (o?.badges ?? []).map((b: any) => textOf(b?.text)));
      return {
        videoId,
        title: textOf(v?.metadata?.title),
        channel: meta.title ?? "",
        channelId,
        published,
        views: viewsText ? approxCount(viewsText) : null,
        viewsText,
        duration: badges.find((b) => /^[\d:]+$/.test(b)) ?? "",
        snippet: "",
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    }
    const videoId = v?.video_id ?? v?.id;
    if (!videoId) return null;
    const viewsText = textOf(v?.view_count) || textOf(v?.short_view_count);
    return {
      videoId,
      title: textOf(v?.title),
      channel: meta.title ?? "",
      channelId,
      published: textOf(v?.published),
      views: viewsText ? approxCount(viewsText) : null,
      viewsText,
      duration: textOf(v?.duration?.text ?? v?.duration),
      snippet: textOf(v?.description_snippet),
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  };

  try {
    let feed: any = await channel.getVideos();
    while (videos.length < maxVideos && feed) {
      for (const v of feed.videos ?? []) {
        const hit = parseFeedItem(v);
        if (!hit || videos.some((x) => x.videoId === hit.videoId)) continue;
        videos.push(hit);
        if (videos.length >= maxVideos) break;
      }
      if (videos.length >= maxVideos) break;
      feed = feed.has_continuation ? await feed.getContinuation() : null;
    }
  } catch (err) {
    if (!videos.length) throw err;
  }

  const subParts = [textOf(header?.metadata?.metadata_rows?.[1]?.metadata_parts?.[0]?.text), textOf((header as any)?.subscribers)].filter(Boolean);
  return {
    channelId,
    name: meta.title ?? "",
    subscribers: subParts[0] ?? "",
    totalVideosText: textOf(header?.metadata?.metadata_rows?.[1]?.metadata_parts?.[1]?.text) ?? "",
    description: (meta.description ?? "").slice(0, 1500),
    recentVideos: videos,
  };
}

/** YouTube autocomplete — a direct read on what people actually search for around a seed term. */
export async function getSearchSuggestions(query: string): Promise<string[]> {
  const yt = await getClient();
  const suggestions = await withRetry(() => yt.getSearchSuggestions(query), { label: `suggestions "${query}"` });
  return (suggestions ?? []).map((s: unknown) => textOf(s)).filter(Boolean);
}
