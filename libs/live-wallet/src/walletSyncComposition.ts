import { z } from "zod";
import { createAggregator } from "@shared/cloud-sync-module";
import { accountNamesSyncModule } from "@domain/entity-account-name";
import { recentAddressesSyncModule } from "@domain/entity-recent-addresses";
import {
  accountsSyncModule,
  bindCtx,
  type CloudSyncDataManagerResolutionContext,
} from "./accounts";

export const walletSyncSchema = z.object({
  accounts: z.optional(accountsSyncModule.schema),
  accountNames: z.optional(accountNamesSyncModule.schema),
  recentAddresses: z.optional(recentAddressesSyncModule.schema),
});

export function createWalletsync(ctx: CloudSyncDataManagerResolutionContext) {
  return createAggregator({
    accounts: bindCtx(ctx),
    accountNames: accountNamesSyncModule,
    recentAddresses: recentAddressesSyncModule,
  });
}

export type Walletsync = ReturnType<typeof createWalletsync>;
export type WalletSyncSchema = Walletsync["schema"];
export type WalletSyncDistantState = z.infer<typeof walletSyncSchema>;
export type WalletSyncLocalState = ReturnType<Walletsync["applyUpdate"]>;

export function parseDistantState(
  walletsync: Walletsync,
  raw: unknown,
): WalletSyncDistantState | null {
  const result = walletsync.schema.safeParse(raw);
  // returns raw, not result.data: zod strips unknown keys and we must preserve fields
  // written by newer app versions so re-uploading this state does not drop them.
  return result.success ? (raw as WalletSyncDistantState) : null;
}
