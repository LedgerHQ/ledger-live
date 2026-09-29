import { createAccountDataRouter } from "@features/platform-account-data";
import { createCoinModuleSource, FullSyncSource } from "@ledgerhq/live-common/account-data/index";
import { prepareCurrency } from "~/renderer/bridge/cache";
import { accountSelector } from "~/renderer/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import type { ReduxStore } from "~/state-manager/configureStore";

export function createAppAccountDataRouter(store: Pick<ReduxStore, "getState">) {
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
