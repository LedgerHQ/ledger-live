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

import { EMPTY, Observable } from "rxjs";
import type { ShieldedSyncResult } from "./types";

export { ZCashNative } from "./ZCashNative";
export { ZCASH_JSON_RPC_SERVER_MAINNET, ZCASH_JSON_RPC_SERVER_TESTNET } from "./constants";

export type SyncShieldedArgs = {
  startBlockHeight: number;
  viewingKey: string;
  maxBatchSize: number;
};

export class ZCash {
  constructor(_args: { nodeUrl: string }) {}

  syncShielded(_args: SyncShieldedArgs): Observable<ShieldedSyncResult> {
    return EMPTY;
  }
}
