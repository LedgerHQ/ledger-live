import { log } from "@ledgerhq/logs";

/*
 * This whole patch thing is messy:
 * It's goal is to: Fix error when sending a token transaction in Stellar
 * It originally was in ledger-mobile polyfill.ts (https://github.com/LedgerHQ/ledger-live/pull/9687)
 * But globally patching is not a good idea, and broke the polkadot sdk
 */

// Save original methods once at app startup
const OriginalTypedArrayMethods = {
  subarray: Uint8Array.prototype.subarray,
  slice: Uint8Array.prototype.slice,
  map: Uint8Array.prototype.map,
  filter: Uint8Array.prototype.filter,
};

// Track whether we actually patched
let hermesTypedArrayPatched = false;

export function patchHermesTypedArraysIfNeeded() {
  if (global.HermesInternal) {
    if (!hermesTypedArrayPatched) {
      try {
        log("coin:stellar", "🔵 Patching TypedArray because of Hermes bug");
        require("@exodus/patch-broken-hermes-typed-arrays");
        hermesTypedArrayPatched = true;
      } catch (e) {
        log("coin:stellar", "Failed to patch typed arrays");
      }
    }
  }
}

export function unpatchHermesTypedArrays() {
  if (hermesTypedArrayPatched) {
    const TypedArray = Object.getPrototypeOf(Uint8Array);

    TypedArray.prototype.subarray = OriginalTypedArrayMethods.subarray;
    TypedArray.prototype.slice = OriginalTypedArrayMethods.slice;
    TypedArray.prototype.map = OriginalTypedArrayMethods.map;
    TypedArray.prototype.filter = OriginalTypedArrayMethods.filter;

    log("coin:stellar", "🟢 Reverted TypedArray methods to originals");
    hermesTypedArrayPatched = false; // reset
  }
}
