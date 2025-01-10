import React, { Component } from "react";
import { Provider } from "react-redux";
import { type StoreType } from "./store";
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

export default class LedgerStoreProvider extends Component<
  {
    onInitFinished: () => void;
    children: (ready: boolean, initialCountervalues?: CounterValuesStateRaw) => JSX.Element;
    store: StoreType;
  },
  {
    ready: boolean;
    initialCountervalues?: CounterValuesStateRaw;
  }
> {
  state = {
    ready: false,
    initialCountervalues: undefined,
  };

  componentDidMount() {
    return this.init();
  }

  componentDidCatch(e: Error) {
    console.error(e);
    throw e;
  }

  async init() {
    const startTime = Date.now();

    const logTime = (label: string) => {
      const elapsed = Date.now() - startTime;
      console.log(`${label} took ${elapsed}ms`);
    };

    const blePromise = getBle();
    const settingsPromise = getSettings();
    const cachedCurrencyIdsPromise = listCachedCurrencyIds();
    const supportedFiatsPromise = listSupportedFiats();
    const accountsPromise = getAccounts();
    const postOnboardingStatePromise = getPostOnboardingState();
    const marketStatePromise = getMarketState();
    const trustchainStorePromise = getTrustchainState();
    const walletStorePromise = getWalletExportState();
    const protectPromise = getProtect();
    const countervaluesPromise = getCountervalues();

    const bleData = await blePromise;
    logTime("getBle");
    this.props.store.dispatch(importBle(bleData));

    const settingsData = await settingsPromise;
    logTime("getSettings");

    const cachedCurrencyIds = await cachedCurrencyIdsPromise;
    logTime("listCachedCurrencyIds");

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
    logTime("hydrateCurrency");

    const supportedFiats = await supportedFiatsPromise;
    logTime("listSupportedFiats");

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

    if (this.props?.store?.dispatch) {
      this.props.store.dispatch(setSupportedCounterValues(supportedCounterValues));
    }
    logTime("getsupportedCountervalues");

    if (
      settingsData &&
      settingsData.counterValue &&
      !supportedCounterValues.find(({ ticker }) => ticker === settingsData.counterValue)
    ) {
      settingsData.counterValue = settingsState.counterValue;
    }

    this.props.store.dispatch(importSettings(settingsData));
    logTime("importSettings");

    const accountsData = await accountsPromise;
    logTime("getAccounts");
    this.props.store.dispatch(importAccountsRaw(accountsData));

    const postOnboardingState = await postOnboardingStatePromise;
    logTime("getPostOnboardingState");
    if (postOnboardingState) {
      this.props.store.dispatch(importPostOnboardingState({ newState: postOnboardingState }));
    }

    const marketState = await marketStatePromise;
    logTime("getMarketState");
    if (marketState) {
      this.props.store.dispatch(importMarket(marketState));
    }

    const trustchainStore = await trustchainStorePromise;
    logTime("getTrustchainState");
    if (trustchainStore) {
      this.props.store.dispatch(importTrustchainStoreState(trustchainStore));
    }

    const walletStore = await walletStorePromise;
    logTime("getWalletExportState");
    if (walletStore) {
      this.props.store.dispatch(importWalletState(walletStore));
    }

    const protect = await protectPromise;
    logTime("getProtect");
    if (protect) {
      this.props.store.dispatch(updateProtectData(protect.data));
      this.props.store.dispatch(updateProtectStatus(protect.protectStatus));
    }

    const initialCountervalues = await countervaluesPromise;
    logTime("getCountervalues");

    this.setState(
      {
        ready: true,
        initialCountervalues,
      },
      () => {
        this.props.onInitFinished();
        logTime("onInitFinished");
      },
    );
  }

  render() {
    const { children, store } = this.props;
    const { ready, initialCountervalues } = this.state;
    return <Provider store={store}>{children(ready, initialCountervalues)}</Provider>;
  }
}
