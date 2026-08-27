---
name: yt-gap
description: "Find demand-vs-supply gaps in a niche on YouTube — topics people search for heavily (autocomplete, view counts) that have weak, old, or low-quality videos serving them. Use when the user plans content ('what should I post about X'), hunts for underserved product angles, or asks 'what's missing in X', 'content gaps', 'underserved topics'. Requires the tubescout MCP server."
---

# yt-gap

Demand you can see, supply you can count — the gap between them is the opportunity.
Works for two audiences: creators (what to publish) and builders (what to build).

## Process

1. **Map demand.** `get_search_suggestions` on the seed term, then recurse into the 4–6
   most specific suggestions (and language variants — Arabic/French/Spanish suggestions
   with thin English-style supply are double gaps). Autocomplete only shows queries with
   real volume; specificity = intent.
2. **Measure supply per demand signal.** For each promising query, `search_videos`
   (default sort) and check the top results:
   - **Freshness:** are the top hits years old? (`published` fields)
   - **Fit:** do titles actually answer the query, or only adjacent topics?
   - **Quality proxy:** views relative to channel size where visible; clickbait vs substance.
   - **Volume:** many strong recent hits = served; few/old/misfit = gap.
3. **Verify the best 2–3 gaps.** `get_video` on the top incumbent (age, engagement) and,
   if depth is needed, `get_transcript` to confirm the incumbent is actually weak or
   outdated — a gap that survives reading the competition is real.
4. **Rank and frame.** Each gap gets: the demand evidence (which suggestions, which view
   counts) / the supply weakness (old, misfit, thin) / the move (video topic + angle for
   creators, product angle for builders). Tailor to what the conversation says the user
   does — an n8n consultant gets automation gaps framed as content topics, a developer
   gets them framed as tool ideas.

## Rules

- A gap needs BOTH sides evidenced. High demand + strong supply = red ocean; no demand
  signal + no supply = probably no market, not a gap. Say which is which.
- YouTube demand ≠ total market: some B2B niches search Google, not YouTube. Flag when
  the niche is likely one of those.
- Recency window matters: check supply within the last year, not all time — a 2019
  million-view video with no modern successor IS the gap.

## Troubleshooting

- Tools missing → connect tubescout: `claude mcp add --scope user tubescout -- npx -y tubescout`, `codex mcp add tubescout -- npx -y tubescout`, or the OpenCode `opencode.json` mcp entry.
- Suggestions too generic → seed with "<niche> + <audience/tool/problem>" instead of the bare niche.
