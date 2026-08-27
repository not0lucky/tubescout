import { Innertube, Log } from "youtubei.js";

// youtubei.js parser warnings write to console; on an MCP stdio server that corrupts the protocol.
Log.setLevel(Log.Level.NONE);

let instance: Promise<Innertube> | null = null;

/** Lazy singleton — Innertube.create() does a network handshake, so only pay for it on first use. */
export function getClient(): Promise<Innertube> {
  if (!instance) {
    instance = Innertube.create({ retrieve_player: false });
    instance.catch(() => {
      instance = null; // let a later call retry the handshake
    });
  }
  return instance;
}
