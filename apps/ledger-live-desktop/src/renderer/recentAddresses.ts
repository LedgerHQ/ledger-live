import {
  setupRecentAddressesStore as baseSetupRecentAddressesStore,
  getRecentAddressesStore,
  RecentAddressesCache,
} from "@ledgerhq/live-common/account/index";
import { updateRecentAddresses } from "@ledgerhq/live-wallet/store";
import { ReduxStore } from "./createStore";
import { recentAddressesSelector } from "./reducers/wallet";
import { Unsubscribe } from "@reduxjs/toolkit";

let unsubscribe: Unsubscribe;

export async function setupRecentAddressesStore(store: ReduxStore): Promise<void> {
  const addressesByCurrency = recentAddressesSelector(store.getState());

  const onAddAddressComplete = (addressesByCurrency: RecentAddressesCache) => {
    store.dispatch(updateRecentAddresses(addressesByCurrency));
  };

  baseSetupRecentAddressesStore(addressesByCurrency, onAddAddressComplete);

  /**
   * Sometimes, the state is not up to date, we need to see if additional data is present
   * and add it to the current store instance
   */
  unsubscribe = store.subscribe(() => {
    const cache = recentAddressesSelector(store.getState());
    if (Object.keys(cache).length > 0) {
      unsubscribe();
      getRecentAddressesStore().syncAddresses(cache);
    }
  });
}
