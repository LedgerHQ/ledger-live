import { defer, from, mergeMap, Observable } from "rxjs";
import type { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import type { ZCash } from "@ledgerhq/zcash-shielded/ZCash";
import type { ZCashNative } from "@ledgerhq/zcash-shielded/ZCashNative";
import type { ShieldedSyncResult } from "@ledgerhq/zcash-shielded/types";
import type { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { SyncConfig } from "@ledgerhq/types-live";
import type { ZcashAccount } from "./types";
import { ZCASH_GRPC_URL_MAINNET } from "@ledgerhq/zcash-shielded/constants";

export type FamilyConfig = {
  sync?: (
    acc: AccountShapeInfo<ZcashAccount>,
    syncConfig: SyncConfig,
  ) => Observable<ShieldedSyncResult>;
};

const ZCASH_MAX_BATCH_SIZE = 100;
const ZCASH_NATIVE_CHUNK_SIZE = 5_000;

/** Toggle: true = native Rust engine (tonic gRPC), false = JSON-RPC fallback. */
let useNative = true;

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
 */
export const setUseNative = (enabled: boolean): void => {
  useNative = enabled;
};

// Two separate lazy imports to avoid loading the WASM module when using the native engine.
// - Native path: imports only ZCashNative (no @ledgerhq/zcash-decrypt WASM dependency)
// - JSON-RPC path: imports ZCash (includes WASM)
let nativeModuleCache: Promise<{ ZCashNative: typeof ZCashNative }> | null = null;
let jsonRpcModuleCache: Promise<{
  ZCash: typeof ZCash;
  ZCASH_JSON_RPC_SERVER_MAINNET: string;
}> | null = null;

const getNativeModule = () => {
  nativeModuleCache ??= import(
    /* webpackChunkName: "zcash-native" */ "@ledgerhq/zcash-shielded/ZCashNative"
  );
  return nativeModuleCache;
};

const getJsonRpcModule = () => {
  jsonRpcModuleCache ??= import(
    /* webpackChunkName: "zcash-jsonrpc" */ "@ledgerhq/zcash-shielded/ZCash"
  );
  return jsonRpcModuleCache;
};

async function resolveStartBlockHeight(
  lastProcessedBlock: number | null | undefined,
  birthday: string | null | undefined,
  findBlockHeight: (timestamp: number) => Promise<number>,
): Promise<number> {
  if (lastProcessedBlock !== null && lastProcessedBlock !== undefined) {
    return lastProcessedBlock + 1;
  }
  if (birthday) {
    const ts = Math.floor(new Date(birthday).getTime() / 1000);
    return findBlockHeight(ts);
  }
  return 0;
}

const zcashSyncShielded = (
  acc: AccountShapeInfo<ZcashAccount>,
  _syncConfig: SyncConfig,
): Observable<ShieldedSyncResult> => {
  return defer(() => {
    const viewingKey = acc.initialAccount?.privateInfo?.ufvk;
    if (!viewingKey) {
      throw new Error("Missing unified full viewing key (ufvk) for ZCash shielded sync");
    }
    const { lastProcessedBlock, birthday } = acc.initialAccount?.privateInfo ?? {};

    if (useNative) {
      // Native Rust engine: only loads ZCashNative — no WASM dependency
      return from(getNativeModule()).pipe(
        mergeMap(({ ZCashNative }) => {
          const client = new ZCashNative({
            grpcUrl: ZCASH_GRPC_URL_CUSTOM ?? ZCASH_GRPC_URL_MAINNET,
          });
          return from(
            resolveStartBlockHeight(lastProcessedBlock, birthday, ts => client.findBlockHeight(ts)),
          ).pipe(
            mergeMap(startBlockHeight =>
              client.syncShielded({
                startBlockHeight,
                viewingKey,
                maxBatchSize: ZCASH_NATIVE_CHUNK_SIZE,
              }),
            ),
          );
        }),
      );
    }

    // JSON-RPC path: loads ZCash (includes @ledgerhq/zcash-decrypt WASM)
    return from(getJsonRpcModule()).pipe(
      mergeMap(({ ZCash, ZCASH_JSON_RPC_SERVER_MAINNET }) => {
        const zcash = new ZCash({
          nodeUrl: ZCASH_JSON_RPC_SERVER_CUSTOM ?? ZCASH_JSON_RPC_SERVER_MAINNET,
        });
        return from(
          resolveStartBlockHeight(lastProcessedBlock, birthday, async ts => {
            const height = await zcash.findBlockHeight(ts);
            return height ?? 0;
          }),
        ).pipe(
          mergeMap(startBlockHeight =>
            zcash.syncShielded({
              startBlockHeight,
              viewingKey,
              maxBatchSize: ZCASH_MAX_BATCH_SIZE,
            }),
          ),
        );
      }),
    );
  });
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
