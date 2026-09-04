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

/**
 * Wire the account-data layer for this app.
 *
 * Same shape as `setupCryptoAssetsStore` — the composition root owns the wiring, the package owns
 * the contract. Only the store accessors are this app's; the sources themselves are shared, so
 * desktop and mobile cannot drift into disagreeing about which families are granular.
 */
export function setupAccountData(store: ReduxStore): void {
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
