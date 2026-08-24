import { z } from "zod";
import { createAggregator, type AggregatorOptions } from "@shared/cloud-sync-module";

export type {
  AggregatorOptions,
  CloudSyncModuleQuarantined,
  DistantDocument,
} from "@shared/cloud-sync-module";
import { accountNamesSyncModule } from "@domain/entity-account-name";
import { recentAddressesSyncModule } from "@domain/entity-recent-addresses";
import {
  accountsSyncModule,
  bindCtx,
  type CloudSyncDataManagerResolutionContext,
} from "./accounts";

/** the shape we author; one we read is a DistantDocument, validated per module by the aggregator */
export const walletSyncSchema = z.object({
  accounts: z.optional(accountsSyncModule.schema),
  accountNames: z.optional(accountNamesSyncModule.schema),
  recentAddresses: z.optional(recentAddressesSyncModule.schema),
});

export function createWalletsync(
  ctx: CloudSyncDataManagerResolutionContext,
  options?: AggregatorOptions,
) {
  return createAggregator(
    {
      accounts: bindCtx(ctx),
      accountNames: accountNamesSyncModule,
      recentAddresses: recentAddressesSyncModule,
    },
    options,
  );
}

export type Walletsync = ReturnType<typeof createWalletsync>;
export type WalletSyncSchema = Walletsync["schema"];
export type WalletSyncDocument = z.infer<typeof walletSyncSchema>;
export type WalletSyncLocalState = ReturnType<Walletsync["applyUpdate"]>;
