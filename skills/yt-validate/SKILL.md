---
name: yt-validate
description: "Validate a product/business idea against YouTube's market signal — search demand, competitor saturation, and what builders in the space actually report. Use when the user asks 'is there demand for X', 'is X saturated', 'should I build X', or wants a go/no-go read on an idea before investing time. Requires the tubescout MCP server."
---

# yt-validate

A fast, evidence-based saturation-and-demand check. The output is a verdict with
receipts, not encouragement.

## Process

1. **Demand.** `get_search_suggestions` on the idea's core terms (the noun people would
   search, not the product name). Rich, specific suggestions = real search demand;
   empty/generic = weak signal (note: absence of YouTube demand ≠ no market — some
   B2B niches don't live on YouTube; say so when relevant).
2. **Saturation.** `search_videos` for the idea and its category:
   - How many videos directly cover it? How recent? (`uploadDate: year`)
   - Are there "$X/month with <idea>" case studies already? How many creators?
   - `get_video` on the top 2–3: views, publish dates, engagement.
   A crowded case-study field means the wave is late-stage; a few strong recent ones
   mean it's validated but open; none means unproven (which cuts both ways).
3. **Ground truth.** `get_transcript` on the 2–3 most substantive competitor/case-study
   videos. Extract: actual revenue evidence, what the incumbents do badly, complaints
   in passing, and how hard the thing was to build/distribute.
4. **Verdict.** One of: **validated-and-open / validated-but-crowded / unproven /
   crowded-and-late**. State the 2–3 facts that drove it, what would change it, and
   the cheapest next test the user could run. Where the conversation reveals the user's
   assets (existing skills, infra, audience, distribution), weigh them: "crowded" can
   still be a yes for someone with an unfair advantage the incumbents lack — name it
   explicitly when that applies.

## Rules

- Cite only URLs returned by tubescout tools in this conversation — never write a YouTube URL or video ID from memory.
- Timestamps matter: a 2024 gold rush may be a 2026 graveyard. Weight recent evidence.
- Distinguish "many videos about X" (education demand — good) from "many products
  doing X" (competition — check both).
- If the evidence is thin, say "thin evidence", not a hedged maybe-verdict.

## Troubleshooting

- Tools missing → connect tubescout: `claude mcp add --scope user tubescout -- npx -y tubescout` or `codex mcp add tubescout -- npx -y tubescout`.
- Ambiguous idea → ask the user for the target buyer before validating; demand checks on vague ideas produce vague verdicts.
