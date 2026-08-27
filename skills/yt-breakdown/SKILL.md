---
name: yt-breakdown
description: "Skeptic's breakdown of one or more YouTube videos — extract every factual claim, number, and method from the transcripts, then stress-test them for incentives, survivorship bias, and verifiability. Use when the user shares YouTube link(s) and asks 'what do you think', 'is this legit', 'summarize this', or wants business/tech claims from videos checked rather than repeated. Requires the tubescout MCP server."
---

# yt-breakdown

Turn business/tech YouTube into verified intelligence instead of taking the creator's word.
Works on 1–10 videos; with multiple videos, cross-reference them.

## Process

1. **Fetch.** For each URL/ID: `get_video` (metadata + engagement) and `get_transcript`
   (batch with `get_transcripts` when >2 videos). If a transcript fails, say so and
   continue with the rest — never summarize a video you couldn't read.
2. **Extract claims.** From each transcript, list every concrete claim: revenue figures,
   growth timelines, conversion rates, methods, tools named. Quote numbers exactly —
   never round or embellish them.
3. **Skeptic pass** — for each video answer:
   - **Incentive:** what does the creator sell (course, community, ebook, their channel
     itself)? The pitch is usually in the last 20% of the transcript.
   - **Survivorship:** is this one winner speaking, or a repeatable process? What
     failures are mentioned or conspicuously absent?
   - **Verifiability:** which claims are shown (dashboards, names, dates) vs asserted?
   - **Freshness:** check publish date — does the tactic still work, or did the
     platform/algorithm change since?
4. **Cross-reference** (multi-video): where do independent creators agree? Agreement
   across creators with different incentives is the strongest signal in this method.
5. **Report.** Lead with the verdict, then per-video: what it actually says (with the
   real numbers), what survives the skeptic pass, what doesn't. End with "what this
   means for you" grounded in the user's actual situation if known.

## Rules

- Engagement context: `likesPer1kViews` of 10–50 is typical; far above = resonant,
  far below = clickbait suspicion. Mention it only when it's informative.
- Distinguish the creator's *evidence* from the creator's *advice*. Evidence can be
  weighed; advice is marketing until corroborated.
- Never present a video's claim as your own conclusion.

## Troubleshooting

- Tools missing → the tubescout MCP server isn't connected. Install:
  `claude mcp add --scope user tubescout -- npx -y tubescout` (Claude Code) or
  `codex mcp add tubescout -- npx -y tubescout` (Codex).
- Transcript >60k chars → call `get_transcript` again with `offsetChars` until `hasMore` is false.
- All transcript strategies fail → captions are disabled or the IP is rate-limited; report it and analyze metadata only, flagged as low-confidence.
