import {
  createAccountBalanceSources,
  createAccountOperationsSources,
} from "@ledgerhq/live-common/account-data/sources";
import {
  registerAccountBalanceSources,
  registerAccountOperationsSources,
} from "@features/platform-account-data";
import { prepareCurrency } from "~/bridge/cache";
import { accountSelector } from "~/reducers/accounts";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";
import type { StoreType } from "~/state-manager/configureStore";

export { accountRefOf } from "@ledgerhq/live-common/bridge/generic-coin-framework/accountBalances";

/**
 * Wire the account-data layer for this app.
 *
 * Nothing on mobile reads the balance table yet. It is wired so that the first screen that wants to
 * costs a hook call rather than an integration.
 */
export function setupAccountData(store: StoreType): void {
  const hostAccess = {
    getAccount: (accountId: string) => accountSelector(store.getState(), { accountId }),
    prepareCurrency,
    blacklistedTokenIds: () => blacklistedTokenIdsSelector(store.getState()),
  };

  registerAccountBalanceSources(createAccountBalanceSources(hostAccess));
  // History stays on the full sync for every family: `listOperations` parity is unproven, and a
  // source that silently omits an operation is worse than one that is slow. Opting a family in is
  // `granularOperationFamilies` here — see LIVE-36923.
  registerAccountOperationsSources(createAccountOperationsSources(hostAccess));
}
