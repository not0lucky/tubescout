#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer, VERSION } from "./server.js";

// stdout belongs to the MCP protocol — anything that tries to console.log goes to stderr instead.
console.log = (...args: unknown[]) => console.error(...args);

if (process.argv.includes("--version") || process.argv.includes("-v")) {
  process.stdout.write(`tubescout ${VERSION}\n`);
  process.exit(0);
}

const server = createServer();
const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[tubescout] v${VERSION} ready on stdio`);
