import { getEnv } from "@shared/env";
import { createAccountDataRouter, type AccountDataExtra } from "@domain/api-account-data-source";
import { CoinModuleSource } from "@features/platform-account-source-coin-module";
import {
  FullSyncSource,
  findAccountByDescriptor,
} from "@ledgerhq/live-common/account-data/FullSyncSource";
import {
  loadCoinModule,
  tokenAccountIdOf,
} from "@ledgerhq/live-common/account-data/coinModulePorts";
import { getEnabledGenericCoinFrameworkFamilies } from "@ledgerhq/live-common/bridge/generic-coin-framework/genericCoinFrameworkFamilies";
import { prepareCurrency } from "~/bridge/cache";
import { accountsSelector } from "~/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import type { State } from "~/reducers/types";

// The families the coin module source serves, per datum. Operations stay on the full sync until the
// coin module history is proven on par.
const coinModuleFamilies = {
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
        findAccount: descriptor =>
          findAccountByDescriptor(accountsSelector(getState()), descriptor),
        prepareCurrency,
        blacklistedTokenIds,
        concurrency: getEnv("SYNC_MAX_CONCURRENT"),
      }),
    ]),
  };
}
