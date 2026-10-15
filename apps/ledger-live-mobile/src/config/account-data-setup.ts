import type { AccountDataSource } from "@domain/api-account-data";
import { createCoinModuleSource } from "@features/platform-account-source-coin-module";
import {
  createFullSyncSource,
  findAccountByDescriptor,
} from "@ledgerhq/live-common/account-data/fullSyncSource";
import { loadCoinModule } from "@ledgerhq/live-common/account-data/coinModulePorts";
import { getEnabledGenericCoinFrameworkFamilies } from "@ledgerhq/live-common/bridge/generic-coin-framework/genericCoinFrameworkFamilies";
import { prepareCurrency } from "~/bridge/cache";
import { accountsSelector } from "~/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import type { State } from "~/reducers/types";

/** The app's account data sources, in rank order: for each account, the first that serves it answers. */
export function accountDataSources(getState: () => State): readonly AccountDataSource[] {
  const blacklistedTokenIds = (): string[] => blacklistedTokenIdsSelector(getState());
  return [
    // Operations stay on the full sync until the coin module history is proven on par.
    createCoinModuleSource({
      loadCoinModule,
      families: { balance: getEnabledGenericCoinFrameworkFamilies },
      blacklistedTokenIds,
    }),
    createFullSyncSource({
      findAccount: descriptor => findAccountByDescriptor(accountsSelector(getState()), descriptor),
      prepareCurrency,
      blacklistedTokenIds,
    }),
  ];
}
