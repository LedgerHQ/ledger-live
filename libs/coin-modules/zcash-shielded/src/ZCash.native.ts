// React Native stub — Metro/Repack resolves this file instead of ZCash.ts.
//
// The JSON-RPC backend depends on `@ledgerhq/zcash-decrypt` which ships a WASM
// module unusable inside a React Native bundle. This stub exports a no-op
// class plus the public constants so the mobile bundler does not pull the
// WASM payload into the graph.
//
// ZCash should never be instantiated on mobile: coin-bitcoin's
// `zcashShieldedSyncEnabled` defaults to `false` so `zcashSyncShielded` — the
// only runtime caller of this module — is never invoked.

import { Observable, throwError } from "rxjs";
import type { ShieldedSyncResult } from "./types";

export { ZCashNative } from "./ZCashNative";
export { ZCASH_JSON_RPC_SERVER_MAINNET, ZCASH_JSON_RPC_SERVER_TESTNET } from "./constants";

const UNSUPPORTED_ERROR_MESSAGE = "ZCash is not supported on React Native";

export type SyncShieldedArgs = {
  startBlockHeight: number;
  viewingKey: string;
  maxBatchSize: number;
};

export class ZCash {
  constructor(_args: { nodeUrl: string }) {}

  syncShielded(_args: SyncShieldedArgs): Observable<ShieldedSyncResult> {
    return throwError(() => new Error(UNSUPPORTED_ERROR_MESSAGE));
  }
}
