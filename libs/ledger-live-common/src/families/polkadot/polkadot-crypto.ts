import "@polkadot/wasm-crypto/initOnlyAsm";
import { cryptoWaitReady } from "@polkadot/util-crypto";

let loadingPromise: null | Promise<boolean>;

export function loadPolkadotCrypto(): Promise<boolean> {
  if (loadingPromise) return loadingPromise;
  const p = cryptoWaitReady();
  loadingPromise = p;
  return p;
}
