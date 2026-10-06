export type AleoWasm = typeof import("@provablehq/sdk/testnet.js");

let cached: Promise<AleoWasm> | null = null;

/**
 * Dynamic import because the SDK is ESM-only; cached because two wasm instances have incompatible classes.
 * Consensus test heights must be initialised or the devnode rejects deployments ("missing program checksum").
 */
export function loadAleoWasm(): Promise<AleoWasm> {
  cached ??= import("@provablehq/sdk/testnet.js").then(wasm => {
    wasm.getOrInitConsensusVersionTestHeights();
    return wasm;
  });
  return cached;
}
