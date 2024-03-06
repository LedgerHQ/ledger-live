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
} from "../db";
import { importSettings, setSupportedCounterValues } from "~/actions/settings";
import { importStore as importAccounts } from "~/actions/accounts";
import { importBle } from "~/actions/ble";
import { updateProtectData, updateProtectStatus } from "~/actions/protect";
import { INITIAL_STATE as settingsState } from "~/reducers/settings";
import { listCachedCurrencyIds, hydrateCurrency } from "~/bridge/cache";
import { getCryptoCurrencyById, listSupportedFiats } from "@ledgerhq/live-common/currencies/index";

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
    const bleData = await getBle();
    this.props.store.dispatch(importBle(bleData));
    const settingsData = await getSettings();

    const cachedCurrencyIds = await listCachedCurrencyIds();
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

    const getsupportedCountervalues = async () => {
      const supportedFiats = await listSupportedFiats();
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

      return supportedCounterValues || [];
    };

    const supportedCV = await getsupportedCountervalues();

    if (
      settingsData &&
      settingsData.counterValue &&
      !supportedCV.find(({ ticker }) => ticker === settingsData.counterValue)
    ) {
      settingsData.counterValue = settingsState.counterValue;
    }

    this.props.store.dispatch(importSettings(settingsData));
    const accountsData = await getAccounts();
    this.props.store.dispatch(importAccounts(accountsData));

    const postOnboardingState = await getPostOnboardingState();
    if (postOnboardingState) {
      this.props.store.dispatch(importPostOnboardingState({ newState: postOnboardingState }));
    }

    const protect = await getProtect();
    if (protect) {
      this.props.store.dispatch(updateProtectData(protect.data));
      this.props.store.dispatch(updateProtectStatus(protect.protectStatus));
    }

    const initialCountervalues = await getCountervalues();
    this.setState(
      {
        ready: true,
        initialCountervalues,
      },
      () => {
        this.props.onInitFinished();
      },
    );
  }

  render() {
    const { children, store } = this.props;
    const { ready, initialCountervalues } = this.state;
    return <Provider store={store}>{children(ready, initialCountervalues)}</Provider>;
  }
}
