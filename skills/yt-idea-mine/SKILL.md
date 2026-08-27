---
name: yt-idea-mine
description: "Mine a niche on YouTube for product/business ideas backed by evidence — real search demand, case-study videos with revenue claims, and pains people describe on camera. Use when the user asks 'find me ideas in X', 'what's working in X', 'mine this niche', or wants opportunities grounded in what real builders report rather than brainstormed. Requires the tubescout MCP server."
---

# yt-idea-mine

YouTube is where founders show receipts (dashboards, revenue, playbooks) that never
appear in Reddit threads. Mine it systematically instead of watching it.

## Process

1. **Map demand.** `get_search_suggestions` on the seed niche term, then on the 3–5 most
   interesting suggestions (suggestions-of-suggestions). Autocomplete = what people
   actually type; note language variants (Arabic/French/Spanish suggestions = underserved
   non-English demand).
2. **Find the case studies.** `search_videos` with 2–4 query shapes:
   - `"<niche>" how I make` / `"<niche>" $ per month` (revenue case studies)
   - `"<niche>" tutorial` sorted by `view_count` (education demand)
   - upload window `month` or `year`, sorted by `view_count` (what's rising)
3. **Read the best evidence.** Pick the 3–6 most-viewed *case-study* videos (skip pure
   hype: no numbers in title/snippet, or clickbait engagement patterns) and pull
   `get_transcripts`. Extract: business model, revenue claimed, method, tools, and —
   most valuable — **complaints and gaps** the creator mentions in passing ("the annoying
   part is…", "there's no good tool for…").
4. **Synthesize ideas.** Each idea must cite its evidence: the demand signal
   (suggestions/views) + the pain source (video + what was said). Ideas without both
   get cut. Rate each: demand evidence / competition seen / effort to test.
5. **Filter through the user.** Rank ideas against what the conversation reveals about
   the user's actual capabilities and assets (skills, infrastructure, audience, domain
   knowledge) — an idea that's a 6/10 in general but sits on the user's unfair advantage
   outranks a generic 8/10. Say when that reranking happens and why.
6. **Report.** Ranked ideas with receipts, then the discarded ones with the reason
   (saturation, no demand signal, single-source, bad founder-fit).

## Rules

- Cite only URLs returned by tubescout tools in this conversation — never write a YouTube URL or video ID from memory.
- Never launder a creator's recycled idea as evidence — a video *saying* "build X, it's
  a great idea" is not a signal; a creator *complaining about a missing tool* is.
- Note each source's incentive (most idea-listicle channels sell idea databases).
- 10–15 tool calls is the normal budget; go deeper only if the user asks.

## Troubleshooting

- Tools missing → connect tubescout: `claude mcp add --scope user tubescout -- npx -y tubescout` or `codex mcp add tubescout -- npx -y tubescout`.
- Niche too broad (suggestions are generic) → re-seed with "<niche> for <audience>" or "<niche> tool".
