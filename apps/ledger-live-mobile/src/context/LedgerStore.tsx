import React, { useEffect, useState, ReactNode, useCallback } from "react";
import { Provider } from "react-redux";
import { Store } from "redux";
import { importPostOnboardingState } from "@ledgerhq/live-common/postOnboarding/actions";
import { CounterValuesStateRaw } from "@ledgerhq/live-countervalues/types";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import {
  getAccounts,
  getCountervalues,
  getSettings,
  getBle,
  getPostOnboardingState,
  getProtect,
  getMarketState,
  getTrustchainState,
  getWalletExportState,
} from "../db";
import { importSettings, setSupportedCounterValues } from "~/actions/settings";
import { importStore as importAccountsRaw } from "~/actions/accounts";
import { importBle } from "~/actions/ble";
import { updateProtectData, updateProtectStatus } from "~/actions/protect";
import { INITIAL_STATE as settingsState } from "~/reducers/settings";
import { listCachedCurrencyIds, hydrateCurrency } from "~/bridge/cache";
import { getCryptoCurrencyById, listSupportedFiats } from "@ledgerhq/live-common/currencies/index";
import { importMarket } from "~/actions/market";
import { importTrustchainStoreState } from "@ledgerhq/ledger-key-ring-protocol/store";
import { importWalletState } from "@ledgerhq/live-wallet/store";

interface Props {
  onInitFinished: () => void;
  children: (ready: boolean, initialCountervalues?: CounterValuesStateRaw) => ReactNode;
  store: Store;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 500;

async function retry<T>(fn: () => Promise<T>, retries: number, delay: number): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(res => setTimeout(res, delay));
      return retry(fn, retries - 1, delay);
    } else {
      throw new Error(`Max retries reached for ${fn.name}`);
    }
  }
}

const LedgerStoreProvider: React.FC<Props> = ({ onInitFinished, children, store }) => {
  const [ready, setReady] = useState(false);
  const [initialCountervalues, setInitialCountervalues] = useState<
    CounterValuesStateRaw | undefined
  >(undefined);

  const init = useCallback(async () => {
    try {
      const [
        bleData,
        settingsData,
        cachedCurrencyIds,
        supportedFiats,
        accountsData,
        postOnboardingState,
        marketState,
        trustchainStore,
        walletStore,
        protect,
        initialCountervalues,
      ] = await Promise.all([
        retry(getBle, MAX_RETRIES, RETRY_DELAY),
        retry(getSettings, MAX_RETRIES, RETRY_DELAY),
        retry(listCachedCurrencyIds, MAX_RETRIES, RETRY_DELAY),
        retry(listSupportedFiats, MAX_RETRIES, RETRY_DELAY),
        retry(getAccounts, MAX_RETRIES, RETRY_DELAY),
        retry(getPostOnboardingState, MAX_RETRIES, RETRY_DELAY),
        retry(getMarketState, MAX_RETRIES, RETRY_DELAY),
        retry(getTrustchainState, MAX_RETRIES, RETRY_DELAY),
        retry(getWalletExportState, MAX_RETRIES, RETRY_DELAY),
        retry(getProtect, MAX_RETRIES, RETRY_DELAY),
        retry(getCountervalues, MAX_RETRIES, RETRY_DELAY),
      ]);

      store.dispatch(importBle(bleData));

      // hydrate the store with the bridge/cache
      // Promise.allSettled doesn't exist in RN
      await Promise.all(
        cachedCurrencyIds
          .map(id => {
            const currency = findCryptoCurrencyById?.(id);
            return currency ? hydrateCurrency(currency) : Promise.reject();
          })
          .map(promise =>
            promise
              .then((value: unknown) => ({ status: "fulfilled", value }))
              .catch((reason: unknown) => ({ status: "rejected", reason })),
          ),
      );

      const bitcoin = getCryptoCurrencyById("bitcoin");
      const ethereum = getCryptoCurrencyById("ethereum");
      const possibleIntermediaries = [bitcoin, ethereum];

      const supportedCounterValues = [...supportedFiats, ...possibleIntermediaries]
        .map(currency => ({
          value: currency.ticker,
          ticker: currency.ticker,
          label: `${currency.name} - ${currency.ticker}`,
          currency,
        }))
        .sort((a, b) => (a.currency.name < b.currency.name ? -1 : 1));

      store.dispatch(setSupportedCounterValues(supportedCounterValues));

      if (
        settingsData &&
        settingsData.counterValue &&
        !supportedCounterValues.find(({ ticker }) => ticker === settingsData.counterValue)
      ) {
        settingsData.counterValue = settingsState.counterValue;
      }

      store.dispatch(importSettings(settingsData));
      store.dispatch(importAccountsRaw(accountsData));

      if (postOnboardingState) {
        store.dispatch(importPostOnboardingState({ newState: postOnboardingState }));
      }

      if (marketState) {
        store.dispatch(importMarket(marketState));
      }

      if (trustchainStore) {
        store.dispatch(importTrustchainStoreState(trustchainStore));
      }

      if (walletStore) {
        store.dispatch(importWalletState(walletStore));
      }

      if (protect) {
        store.dispatch(updateProtectData(protect.data));
        store.dispatch(updateProtectStatus(protect.protectStatus));
      }

      setInitialCountervalues(initialCountervalues);
      setReady(true);
      onInitFinished();
    } catch (error) {
      console.error(
        error instanceof Error
          ? error.message
          : "An unknown error occurred during the StoreProvider initialization",
      );
    }
  }, [store, onInitFinished]);

  useEffect(() => {
    init();
  }, [init]);

  return <Provider store={store}>{children(ready, initialCountervalues)}</Provider>;
};

export default LedgerStoreProvider;
