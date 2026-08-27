#!/usr/bin/env bash
# Installs the tubescout skill pack into Claude Code and/or Codex.
# Usage: ./scripts/install-skills.sh   (run from the repo root, or via npx tubescout-install-skills later)
set -euo pipefail

SRC="$(cd "$(dirname "$0")/../skills" && pwd)"
installed=0

install_into() {
  local dest="$1" label="$2"
  mkdir -p "$dest"
  for skill in "$SRC"/*/; do
    name="$(basename "$skill")"
    rm -rf "${dest:?}/$name"
    cp -R "$skill" "$dest/$name"
  done
  echo "✓ Installed $(ls "$SRC" | wc -l | tr -d ' ') skills into $label ($dest)"
  installed=1
}

# Claude Code
if [ -d "$HOME/.claude" ]; then
  install_into "$HOME/.claude/skills" "Claude Code"
fi

# Codex
if [ -d "$HOME/.codex" ]; then
  install_into "$HOME/.codex/skills" "Codex"
fi

# OpenCode
if [ -d "$HOME/.config/opencode" ]; then
  install_into "$HOME/.config/opencode/skills" "OpenCode"
fi

if [ "$installed" -eq 0 ]; then
  echo "No ~/.claude, ~/.codex, or ~/.config/opencode found — is Claude Code, Codex, or OpenCode installed?"
  exit 1
fi

echo
echo "Skills: yt-breakdown · yt-idea-mine · yt-validate · yt-channel-intel"
echo "They need the tubescout MCP server connected:"
echo "  Claude Code:  claude mcp add --scope user tubescout -- npx -y tubescout"
echo "  Codex:        codex mcp add tubescout -- npx -y tubescout"
echo '  OpenCode:     add to ~/.config/opencode/opencode.json under "mcp":'
echo '                "tubescout": { "type": "local", "command": ["npx", "-y", "tubescout"], "enabled": true }'
