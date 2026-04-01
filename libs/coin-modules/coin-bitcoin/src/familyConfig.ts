import { defer, from, mergeMap, Observable } from "rxjs";
import type { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import type { ZCash, ZCashNative } from "@ledgerhq/zcash-shielded/ZCash";
import type { ShieldedSyncResult } from "@ledgerhq/zcash-shielded/types";
import type { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { SyncConfig } from "@ledgerhq/types-live";
import type { ZcashAccount } from "./types";

export type FamilyConfig = {
  sync?: (
    acc: AccountShapeInfo<ZcashAccount>,
    syncConfig: SyncConfig,
  ) => Observable<ShieldedSyncResult>;
};

const ZCASH_MAX_BATCH_SIZE = 100;
const ZCASH_NATIVE_CHUNK_SIZE = 50_000;

/** Toggle: true = native Rust engine (tonic gRPC), false = JSON-RPC fallback. */
let useNative = false;

let ZCASH_JSON_RPC_SERVER_CUSTOM: string | null = null;
let ZCASH_GRPC_URL_CUSTOM: string | null = null;

/** Override the Zaino JSON-RPC URL used for shielded sync. Pass null to revert to the default. */
export const setZainoNodeUrl = (url: string | null): void => {
  ZCASH_JSON_RPC_SERVER_CUSTOM = url;
};

/** Override the Zaino gRPC URL used for shielded sync. */
export const setZainoGrpcUrl = (url: string | null): void => {
  ZCASH_GRPC_URL_CUSTOM = url;
};

/**
 * Switch between the native Rust engine (tonic gRPC) and the JSON-RPC fallback.
 * Requires setZainoGrpcUrl to have been called with a valid URL before enabling.
 */
export const setUseNative = (enabled: boolean): void => {
  useNative = enabled;
};

type ZcashShieldedModule = {
  ZCash: typeof ZCash;
  ZCashNative: typeof ZCashNative;
  ZCASH_JSON_RPC_SERVER_MAINNET: string;
};

// Lazy load zcash-shielded only when needed for Zcash currency
// The module is cached to avoid reloading on subsequent calls
let zcashShieldedModuleCache: Promise<ZcashShieldedModule> | null = null;

const getZcashShieldedModule = (): Promise<ZcashShieldedModule> => {
  zcashShieldedModuleCache ??= import("@ledgerhq/zcash-shielded/ZCash");
  return zcashShieldedModuleCache;
};

const zcashSyncShielded = (
  acc: AccountShapeInfo<ZcashAccount>,
  _syncConfig: SyncConfig,
): Observable<ShieldedSyncResult> => {
  return defer(() =>
    from(getZcashShieldedModule()).pipe(
      mergeMap(zcashModule => {
        const viewingKey = acc.initialAccount?.privateInfo?.ufvk;
        if (!viewingKey) {
          throw new Error("Missing unified full viewing key (ufvk) for ZCash shielded sync");
        }

        const startBlockHeight = acc.initialAccount?.blockHeight
          ? acc.initialAccount.blockHeight + 1
          : 0;

        // Native Rust engine path: tonic gRPC + trial decryption entirely in Rust
        if (useNative) {
          const grpcUrl = ZCASH_GRPC_URL_CUSTOM;
          if (!grpcUrl) {
            throw new Error("setZainoGrpcUrl must be called before enabling native sync");
          }
          return new zcashModule.ZCashNative({ grpcUrl }).syncShielded({
            startBlockHeight,
            viewingKey,
            maxBatchSize: ZCASH_NATIVE_CHUNK_SIZE,
          });
        }

        // JSON-RPC path
        const zcash = new zcashModule.ZCash({
          nodeUrl: ZCASH_JSON_RPC_SERVER_CUSTOM ?? zcashModule.ZCASH_JSON_RPC_SERVER_MAINNET,
        });

        return zcash.syncShielded({
          startBlockHeight,
          viewingKey,
          maxBatchSize: ZCASH_MAX_BATCH_SIZE,
        });
      }),
    ),
  );
};

export const findFamilyConfigById = (
  cryptoCurrencyId: CryptoCurrencyId,
): FamilyConfig | undefined => {
  if (cryptoCurrencyId === "zcash") {
    return {
      sync: zcashSyncShielded,
    };
  }
};
