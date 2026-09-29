import { createAccountDataRouter } from "@features/platform-account-data";
import { createCoinModuleSource, FullSyncSource } from "@ledgerhq/live-common/account-data/index";
import { prepareCurrency } from "~/bridge/cache";
import { accountSelector } from "~/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import type { StoreType } from "~/state-manager/configureStore";

export function createAppAccountDataRouter(store: Pick<StoreType, "getState">) {
  const blacklistedTokenIds = () => blacklistedTokenIdsSelector(store.getState());
  return createAccountDataRouter([
    createCoinModuleSource({ blacklistedTokenIds }),
    new FullSyncSource({
      getAccount: accountId => accountSelector(store.getState(), { accountId }),
      prepareCurrency,
      blacklistedTokenIds,
    }),
  ]);
}
