export type AleoWasm = typeof import("@provablehq/sdk/testnet.js");

let cached: Promise<AleoWasm> | null = null;

/**
 * @provablehq/sdk is ESM-only. A static import would be compiled to `require()`
 * by swc and fail at runtime, so every consumer goes through this one dynamic
 * import. The promise is cached: instantiating the wasm module twice would give
 * two disjoint sets of classes, and an object from one is not accepted by the
 * other.
 *
 * The devnode fast-forwards straight to the latest consensus version on boot,
 * which requires every deployment transaction to carry a program checksum.
 * The wasm module defaults to pre-versioning behavior and omits it unless
 * `getOrInitConsensusVersionTestHeights()` has run first — without this call,
 * the devnode rejects any deployment with HTTP 500 "missing program checksum".
 */
export function loadAleoWasm(): Promise<AleoWasm> {
  cached ??= import("@provablehq/sdk/testnet.js").then(wasm => {
    wasm.getOrInitConsensusVersionTestHeights();
    return wasm;
  });
  return cached;
}
