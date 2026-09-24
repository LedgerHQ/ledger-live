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
jest.mock("LLM/utils/bootstrapCardSession", () => ({
  bootstrapCardSession: () => Promise.resolve(),
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
  it("is not ready until the feature-flags cache has settled", async () => {
    const store = createStore();
    renderProvider(store);

    // Let every storage read resolve (timers are faked globally): only the cache is still pending.
    await act(async () => {
      for (let i = 0; i < 50; i++) await Promise.resolve();
    });
    expect(mockGetSettings).toHaveBeenCalled();
    expect(screen.getByText("loading")).toBeOnTheScreen();

    await act(async () => {
      store.dispatch(setCachedFlagsSettled());
    });

    expect(await screen.findByText("ready")).toBeOnTheScreen();
  });

  it("becomes ready when the cache settled before the storage reads", async () => {
    const store = createStore();
    store.dispatch(setCachedFlagsSettled());

    renderProvider(store);

    expect(await screen.findByText("ready")).toBeOnTheScreen();
  });
});
