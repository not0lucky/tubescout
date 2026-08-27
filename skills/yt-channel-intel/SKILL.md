---
name: yt-channel-intel
description: "Read a YouTube channel's strategy from its data — what it publishes, what actually performs, cadence, positioning, and what its outliers reveal about audience demand. Use when the user asks 'analyze this channel', 'why does this channel work', 'what should I learn from X', or is planning content and wants a competitor read. Requires the tubescout MCP server."
---

# yt-channel-intel

Channels reveal their strategy in the gap between what they publish and what performs.

## Process

1. **Scan.** `get_channel_videos` with `maxVideos` 30–60. Note subscriber count,
   description/positioning, and upload cadence (cluster the `published` fields).
2. **Find the outliers.** Views per video vs the channel's median. Outliers (>3× median)
   are the audience voting; they matter more than the channel's stated focus.
   `get_video` on the top 2–3 outliers for engagement detail and keywords.
3. **Read the packaging.** Across titles: the repeated formats ("How I…", "$X/month…",
   numbers, brackets), title length, what the thumbnails' promises have in common
   (infer from titles/durations — don't fetch images).
4. **Optional depth.** If the user wants the *content* strategy, `get_transcript` on one
   median video + one outlier and compare structure (hook, pacing, CTA placement).
5. **Report.** Positioning in one line → cadence → what performs vs what they make →
   the 3 transferable tactics, each tied to the specific videos that prove it.

## Rules

- Views are cumulative — normalize by age when comparing recent vs old uploads
  ("3 days ago, 30K" can beat "2 years ago, 100K").
- Subscriber count is vanity; views-per-video and outlier ratio are the signal.
- If the user runs a channel in the same niche, end with the gap analysis: demand the
  target channel proved that the user's channel isn't serving yet.

## Troubleshooting

- Tools missing → connect tubescout: `claude mcp add --scope user tubescout -- npx -y tubescout` or `codex mcp add tubescout -- npx -y tubescout`.
- Channel resolves but 0 videos → it may be a Shorts-only or live-only channel; say so rather than reporting "inactive".
