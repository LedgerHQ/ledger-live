import type { Account } from "@ledgerhq/types-live";
import { createAccountDataRouter, type AccountDataExtra } from "@domain/api-account-data-source";
import { CoinModuleSource } from "@features/platform-account-source-coin-module";
import { FullSyncSource } from "@ledgerhq/live-common/account-data/FullSyncSource";
import {
  loadCoinModule,
  tokenAccountIdOf,
} from "@ledgerhq/live-common/account-data/coinModulePorts";
import { getEnabledGenericCoinFrameworkFamilies } from "@ledgerhq/live-common/bridge/generic-coin-framework/genericCoinFrameworkFamilies";
import { prepareCurrency } from "~/renderer/bridge/cache";
import { accountSelector } from "~/renderer/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import type { State } from "~/renderer/reducers";

/**
 * The families the coin module source serves, per datum. Operations stay on the full sync until the
 * coin module history is proven on par.
 */
export const coinModuleFamilies = {
  balance: getEnabledGenericCoinFrameworkFamilies,
  operations: (): string[] => [],
};

/**
 * The app's sources, in rank order: the coin module for balances on the enabled families, then the
 * full sync for everything else. Spread into the thunk `extraArgument`.
 */
export function accountDataExtra(getState: () => State): AccountDataExtra {
  const blacklistedTokenIds = (): string[] => blacklistedTokenIdsSelector(getState());
  return {
    accountData: createAccountDataRouter([
      new CoinModuleSource({
        loadCoinModule,
        tokenAccountIdOf,
        families: coinModuleFamilies,
        blacklistedTokenIds,
      }),
      new FullSyncSource({
        getAccount: (accountId): Account | undefined => accountSelector(getState(), { accountId }),
        prepareCurrency,
        blacklistedTokenIds,
      }),
    ]),
  };
}
