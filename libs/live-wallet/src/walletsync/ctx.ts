import type { ZodType } from "zod";
import type { CloudSyncDataManager } from "@shared/cloud-sync-module";
import type { WalletSyncDataManager, WalletSyncDataManagerResolutionContext } from "./types";

/**
 * Adapt a ctx-free CloudSyncDataManager (as implemented by the domain/entity packages)
 * to the legacy ctx-carrying WalletSyncDataManager interface this library exposes.
 */
export function ignoreCtx<LocalState, Update, Schema extends ZodType, DistantState>(
  manager: CloudSyncDataManager<LocalState, Update, Schema, DistantState>,
): WalletSyncDataManager<LocalState, Update, Schema, DistantState> {
  return {
    schema: manager.schema,
    diffLocalToDistant: manager.diffLocalToDistant,
    resolveIncrementalUpdate: (_ctx, localData, latestState, incomingState) =>
      manager.resolveIncrementalUpdate(localData, latestState, incomingState),
    applyUpdate: manager.applyUpdate,
  };
}

/**
 * Opposite of ignoreCtx: partially apply a resolution ctx so a legacy manager can be
 * consumed by the ctx-free helpers of @features/platform-wallet-sync.
 */
export function bindCtx<LocalState, Update, Schema extends ZodType, DistantState>(
  manager: WalletSyncDataManager<LocalState, Update, Schema, DistantState>,
  ctx: WalletSyncDataManagerResolutionContext,
): CloudSyncDataManager<LocalState, Update, Schema, DistantState> {
  return {
    schema: manager.schema,
    diffLocalToDistant: manager.diffLocalToDistant,
    resolveIncrementalUpdate: (localData, latestState, incomingState) =>
      manager.resolveIncrementalUpdate(ctx, localData, latestState, incomingState),
    applyUpdate: manager.applyUpdate,
  };
}
