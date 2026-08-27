---
name: yt-playbook
description: "Turn a YouTube tutorial or how-to video into an executable playbook — ordered steps, exact commands/settings/tools named, gotchas the creator mentions in passing, adapted to the user's own stack. Use when the user shares a tutorial and says 'how do I do this', 'extract the steps', 'make this actionable', or wants to follow a video without watching it. Requires the tubescout MCP server."
---

# yt-playbook

Tutorials bury 10 minutes of instructions in 25 minutes of talk. Extract the
instructions, keep the hard-won details, drop the filler.

## Process

1. **Fetch.** `get_video` + `get_transcript`. Note publish date immediately — a 2024
   tutorial for a fast-moving tool needs a freshness warning per step that may have
   changed (UI labels, flags, pricing).
2. **Extract the procedure.** Ordered steps as the creator actually performs them, not
   as they summarize them. For each step capture verbatim: commands, filenames, settings
   values, versions, URLs, prices, keyboard paths ("Settings → API → …").
3. **Harvest the gold in passing.** The most valuable lines in any tutorial are asides:
   "make sure you…", "this failed for me until…", "don't use X, it breaks Y". Collect
   these as a **Gotchas** section — they're why the playbook beats the video.
4. **Adapt to the user.** Check the conversation for the user's actual stack, OS, and
   project. Translate where they differ from the video (their package manager, their
   cloud, their framework version). Mark every adaptation explicitly as yours, not the
   creator's.
5. **Deliver.** Prerequisites → numbered steps (with exact values) → gotchas →
   verification ("you know it worked when…") → what the video skipped or hand-waved.

## Rules

- Never invent a command the creator didn't give; if a step is vague in the video, say
  "creator hand-waves this — likely X" and mark it as inference.
- Multi-part series: ask before fetching more than 3 videos.
- If the video is content-free hype with no real procedure, say so in one line and stop
  — don't fabricate a playbook.

## Troubleshooting

- Tools missing → connect tubescout: `claude mcp add --scope user tubescout -- npx -y tubescout`, `codex mcp add tubescout -- npx -y tubescout`, or the OpenCode `opencode.json` mcp entry.
- Long video (>60k chars) → page through `get_transcript` with `offsetChars` until `hasMore` is false; don't build the playbook from a partial read.
