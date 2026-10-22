import type { AccountDataSource } from "@domain/api-account-data";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { AccountExistence } from "@domain/entity-account-existence";
import { isAccountEmpty } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getEnv } from "@shared/env";
import { toLegacyAccount } from "../../account/accountDescriptor";
import { syncLegacyAccount, type SyncLegacyAccountOptions } from "../full-sync/syncLegacyAccount";
import { placeholderAccount } from "./placeholderAccount";

export type LegacyExistenceHost = {
  prepareCurrency: SyncLegacyAccountOptions["prepareCurrency"];
  blacklistedTokenIds?(): string[];
};

function isLegacyAccount(descriptor: AccountDescriptor): boolean {
  try {
    toLegacyAccount(descriptor);
    return true;
  } catch {
    return false;
  }
}

/**
 * `existence` for any account a legacy bridge can sync, held by the app or not: one sync of a
 * placeholder account, then `isAccountEmpty` as `scanAccounts` decides it. The slow path, until a
 * cheaper source answers first.
 */
export function createLegacyExistenceSource(host: LegacyExistenceHost): AccountDataSource {
  return {
    id: AccountDataSourceIdSchema.parse("legacy-existence"),
    concurrency: getEnv("SYNC_MAX_CONCURRENT"),
    supports: isLegacyAccount,
    read: {
      existence: async ({ descriptor }): Promise<AccountExistence> => {
        const synced = await syncLegacyAccount(placeholderAccount(descriptor), {
          prepareCurrency: host.prepareCurrency,
          blacklistedTokenIds: host.blacklistedTokenIds?.() ?? [],
        });
        return { used: !isAccountEmpty(synced) };
      },
    },
  };
}
