// React Native stub — Metro/Repack resolves this file instead of ZCashNative.ts.
//
// The native Rust engine depends on `@ledgerhq/zcash-utils`, a Node.js .node
// addon that is not available in React Native. This stub exports a no-op class
// so the mobile bundler does not pull the native binary into the graph.
//
// ZCashNative should never be instantiated on mobile: coin-bitcoin's
// `zcashShieldedSyncEnabled` defaults to `false` so `zcashSyncShielded` — the
// only runtime caller of this module — is never invoked.

import { Observable, throwError } from "rxjs";
import type { SyncShieldedArgs } from "./ZCash";
import type { ShieldedSyncResult } from "./types";

const UNSUPPORTED_ERROR_MESSAGE = "ZCashNative is not supported on React Native";

export class ZCashNative {
  readonly grpcUrl: string;
  readonly network: string;

  constructor(args: { grpcUrl: string; network?: string }) {
    this.grpcUrl = args.grpcUrl;
    this.network = args.network ?? "mainnet";
  }

  async getChainTip(): Promise<number> {
    throw new Error(UNSUPPORTED_ERROR_MESSAGE);
  }

  syncShielded(_args: SyncShieldedArgs): Observable<ShieldedSyncResult> {
    return throwError(() => new Error(UNSUPPORTED_ERROR_MESSAGE));
  }
}
