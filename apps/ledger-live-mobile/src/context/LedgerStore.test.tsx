import React from "react";
import { Text } from "react-native";
import { act, render, screen } from "@testing-library/react-native";
import { configureStore } from "@reduxjs/toolkit";
import { featureFlagsReducer, setCachedFlagsSettled } from "@shared/feature-flags";
import LedgerStoreProvider from "./LedgerStore";

const mockGetSettings = jest.fn(() => Promise.resolve(undefined));

jest.mock("../db", () => {
  const empty = () => Promise.resolve(undefined);
  return {
    getAccounts: empty,
    getCountervalues: empty,
    getCryptoAssetsCacheState: empty,
    getFeatureFlagsState: empty,
    saveFeatureFlagsState: empty,
    getSettings: () => mockGetSettings(),
    getBle: empty,
    getHistory: empty,
    getKnownDevices: empty,
    getLargeScreenUpsellModalState: empty,
    getPostOnboardingState: empty,
    getProtect: empty,
    getMarketState: empty,
    getMarketListConfig: empty,
    getMarketBannerState: empty,
    getPayCardState: empty,
    getTrustchainState: empty,
    getWalletExportState: empty,
    getLargeMoverState: empty,
    getIdentities: empty,
    getUser: empty,
  };
});
jest.mock("../helpers/identities", () => ({ initIdentities: () => Promise.resolve() }));
jest.mock("~/logic/postOnboarding/backfillOnboardingDate", () => ({
  backfillOnboardingDate: () => {},
}));
const mockBootstrapCardSession = jest.fn(() => Promise.resolve());
jest.mock("LLM/utils/bootstrapCardSession", () => ({
  bootstrapCardSession: () => mockBootstrapCardSession(),
}));
jest.mock("~/bridge/cache", () => ({
  listCachedCurrencyIds: () => Promise.resolve([]),
  hydrateCurrency: () => Promise.resolve(),
}));

// A store without the feature-flags middleware, so the test decides when the cache settles.
const createStore = () => configureStore({ reducer: { featureFlags: featureFlagsReducer } });

const renderProvider = (store: ReturnType<typeof createStore>) =>
  render(
    <LedgerStoreProvider store={store} onInitFinished={() => {}}>
      {({ ready }) => <Text>{ready ? "ready" : "loading"}</Text>}
    </LedgerStoreProvider>,
  );

describe("LedgerStoreProvider", () => {
  beforeEach(() => {
    mockBootstrapCardSession.mockClear();
  });

  it("is not ready until the feature-flags cache has settled", async () => {
    const store = createStore();
    renderProvider(store);

    // Run init until nothing is left pending: only the cache, which the test never settles.
    await act(() => jest.runAllTimersAsync());

    expect(mockGetSettings).toHaveBeenCalled();
    expect(mockBootstrapCardSession).not.toHaveBeenCalled();
    expect(screen.getByText("loading")).toBeOnTheScreen();

    await act(async () => {
      store.dispatch(setCachedFlagsSettled());
      await jest.runAllTimersAsync();
    });

    expect(mockBootstrapCardSession).toHaveBeenCalledTimes(1);
    expect(screen.getByText("ready")).toBeOnTheScreen();
  });

  it("becomes ready when the cache settled before the storage reads", async () => {
    const store = createStore();
    store.dispatch(setCachedFlagsSettled());

    renderProvider(store);
    await act(() => jest.runAllTimersAsync());

    expect(screen.getByText("ready")).toBeOnTheScreen();
  });
});
