// React Native stub — Metro/Repack resolves this file instead of ZCash.ts.
//
// The JSON-RPC backend depends on `@ledgerhq/zcash-decrypt`, which ships a
// WASM payload unusable inside a React Native bundle. Exporting a no-op class
// plus the public constants here keeps the WASM out of the mobile graph.
//
// If an actual sync is attempted on mobile (e.g. `coin-bitcoin`'s
// `zcashSyncShielded` gets invoked), the stub's `syncShielded` errors loudly
// rather than silently falling back to something half-working.

import { Observable, throwError } from "rxjs";
import type { ShieldedSyncResult, SyncShieldedArgs } from "./types";

export { ZCASH_JSON_RPC_SERVER_MAINNET, ZCASH_JSON_RPC_SERVER_TESTNET } from "./constants";

const UNSUPPORTED_ERROR_MESSAGE = "ZCash is not supported on React Native";

export class ZCash {
  constructor(_args: { nodeUrl: string }) {}

  syncShielded(_args: SyncShieldedArgs): Observable<ShieldedSyncResult> {
    return throwError(() => new Error(UNSUPPORTED_ERROR_MESSAGE));
  }
}
