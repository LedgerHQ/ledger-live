// React Native stub — Metro/Repack resolves this file instead of ZCashNative.ts.
//
// The real `ZCashNative.ts` pulls in `./native-engine/engine.ts`, which imports
// `@ledgerhq/zcash-utils` — a Node.js `.node` addon that cannot run inside a
// React Native bundle. Exporting a no-op class here keeps both the native
// binary and `zcash-utils`'s transitive dependencies out of the mobile graph.
//
// If an actual sync is attempted on mobile (e.g. `coin-bitcoin`'s
// `zcashSyncShielded` gets invoked), the stub's `syncShielded` errors loudly
// rather than silently falling back to something half-working.

import { Observable, throwError } from "rxjs";
import type { ShieldedSyncResult, SyncShieldedArgs } from "./types";

const UNSUPPORTED_ERROR_MESSAGE = "ZCashNative is not supported on React Native";

export class ZCashNative {
  readonly grpcUrl: string;
  readonly network: string;

  constructor(args: { grpcUrl: string; network?: string }) {
    this.grpcUrl = args.grpcUrl;
    this.network = args.network ?? "mainnet";
  }

  async estimatedSyncTime(_totalBlocks: number): Promise<number> {
    throw new Error(UNSUPPORTED_ERROR_MESSAGE);
  }

  async getChainTip(): Promise<number> {
    throw new Error(UNSUPPORTED_ERROR_MESSAGE);
  }

  syncShielded(_args: SyncShieldedArgs): Observable<ShieldedSyncResult> {
    return throwError(() => new Error(UNSUPPORTED_ERROR_MESSAGE));
  }
}
