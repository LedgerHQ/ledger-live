import {
  createAccountBalanceSources,
  createAccountOperationsSources,
} from "@ledgerhq/live-common/account-data/sources";
import {
  registerAccountBalanceSources,
  registerAccountOperationsSources,
} from "@features/platform-account-data";
import { prepareCurrency } from "~/renderer/bridge/cache";
import { accountSelector } from "~/renderer/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import type { ReduxStore } from "~/state-manager/configureStore";

export { accountRefOf } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBalances";

export function setupAccountData(store: ReduxStore): void {
  const hostAccess = {
    getAccount: (accountId: string) => accountSelector(store.getState(), { accountId }),
    prepareCurrency,
    blacklistedTokenIds: () => blacklistedTokenIdsSelector(store.getState()),
  };

  registerAccountBalanceSources(createAccountBalanceSources(hostAccess));
  registerAccountOperationsSources(createAccountOperationsSources(hostAccess));
}
