import { Account, AccountBridge, BridgeCacheSystem, TransactionCommon } from "@ledgerhq/types-live";
import { ZodType, z } from "zod";
import type { DistantDiff, UpdateDiff } from "@shared/cloud-sync-module";

export type { DistantDiff, UpdateDiff } from "@shared/cloud-sync-module";

/**
 * Legacy ctx-carrying variant of CloudSyncDataManager (see @shared/cloud-sync-module for
 * the reconciliation model it documents). Only the `accounts` module still needs a
 * resolution context; ctx.ts converts between the two shapes.
 */
export interface WalletSyncDataManager<
  LocalState,
  Update,
  Schema extends ZodType,
  DistantState = z.infer<Schema>,
> {
  schema: Schema;

  diffLocalToDistant: (
    localData: LocalState,
    latestState: DistantState | null,
  ) => DistantDiff<DistantState>;

  resolveIncrementalUpdate: (
    ctx: WalletSyncDataManagerResolutionContext,
    localData: LocalState,
    latestState: DistantState | null,
    incomingState: DistantState | null,
  ) => Promise<UpdateDiff<Update>>;

  applyUpdate: (localData: LocalState, update: Update) => LocalState;
}

/**
 * this provide the implementations needed by modules to be integrated at the final projects. This is typically because this library is independant from live-common and this context have all the necessary dependencies. Feel free to evolve and adds what modules need to resolve information. (Also note that LLD/LLM will have different implementations, for instance different backends for bridgeCache)
 */
export type WalletSyncDataManagerResolutionContext = {
  getAccountBridge: <T extends TransactionCommon>(
    account: Account,
  ) => AccountBridge<T> | Promise<AccountBridge<T>>;
  bridgeCache: BridgeCacheSystem;
  blacklistedTokenIds?: string[];
};

// utility types

export type ExtractLocalState<T> = T extends WalletSyncDataManager<infer L, any, any> ? L : never;

export type ExtractUpdateEvent<T> = T extends WalletSyncDataManager<any, infer U, any> ? U : never;

export type ExtractSchema<T> = T extends WalletSyncDataManager<any, any, infer S> ? S : never;

export type ExtractDistantState<T> =
  T extends WalletSyncDataManager<any, any, any, infer D> ? D : never;
