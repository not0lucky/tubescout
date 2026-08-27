# TubeScout 🔭

**Turn YouTube into a research engine for your AI agent.** An MCP server (no API key) plus a skill pack that make Claude Code and Codex search YouTube like a database, read transcripts at scale, and mine videos for evidence — claims, numbers, demand signals — instead of vibes.

Idea-engine tools scan Reddit and forums. YouTube is where founders show *receipts* — revenue dashboards, playbooks, real numbers on camera — and nothing mines it. TubeScout does.

## Quickstart (60 seconds)

**Claude Code**

```bash
claude mcp add --scope user tubescout -- npx -y tubescout
```

**Codex**

```bash
codex mcp add tubescout -- npx -y tubescout
```

That's it — no API key, no config. Then ask your agent things like:

> *"Find the 5 most-viewed videos about n8n from the last month and summarize what people are struggling with."*

**Optional but recommended — the skill pack:**

```bash
git clone https://github.com/OWNER/tubescout && cd tubescout
./scripts/install-skills.sh   # installs into ~/.claude/skills and ~/.codex/skills
```

## Tools

| Tool | What it does |
|---|---|
| `search_videos` | Search with filters (upload window, duration, sort by views/date) |
| `get_video` | Full metadata + engagement (`likesPer1kViews` resonance signal) |
| `get_transcript` | Plain-text transcript via a resilient 3-strategy fallback chain |
| `get_transcripts` | Batch transcripts (up to 10 videos), per-video error tolerant |
| `get_channel_videos` | Channel positioning + recent uploads with view counts |
| `get_search_suggestions` | YouTube autocomplete = real search demand for keyword research |

## Skills (the research methods)

| Skill | Use it to |
|---|---|
| `/yt-breakdown <urls>` | Skeptic's analysis of videos: extract every claim and number, stress-test for incentives, survivorship bias, verifiability |
| `/yt-idea-mine <niche>` | Mine a niche for product ideas backed by demand signals + pains real builders describe on camera |
| `/yt-validate <idea>` | Go/no-go verdict: demand, saturation, what competitors' numbers actually show |
| `/yt-channel-intel <channel>` | Read a channel's strategy: cadence, outliers, what performs vs what they publish |

See [a real `/yt-breakdown` run](examples/breakdown-3-videos.md) on three "how I make $X/month" videos — including what survived the skeptic pass and what didn't.

## How it works (honestly)

There's no magic here, and that's the point:

- **youtubei.js** talks to YouTube's internal InnerTube API — the same one the site uses. No key, no quota.
- Transcripts are YouTube's own captions, fetched through a **fallback chain**: the ANDROID-client timedtext track → the InnerTube transcript endpoint (known to 400 intermittently — retried with backoff) → local `yt-dlp` if you have it. Each response tells you which `source` served it.
- All analysis happens in *your* agent. The server ships data; the skills ship method.

## Limitations

- **Run it locally.** YouTube aggressively rate-limits datacenter IPs — this is a local stdio server by design, not a hosted service.
- YouTube changes internals without notice; when it breaks, update (`npx` always pulls latest) and file an issue with the failing video ID.
- Videos with captions disabled can't be transcribed (rare; the error says so explicitly).
- Caption scraping lives in YouTube ToS gray area — fine for local research tooling, don't build a hosted paid product on it.

## Development

```bash
npm install && npm run build
npm test          # unit tests (offline)
npm run test:live # live smoke tests against real videos — run before publishing
npm run inspect   # MCP Inspector against the built server
```

MIT — see [LICENSE](LICENSE).
