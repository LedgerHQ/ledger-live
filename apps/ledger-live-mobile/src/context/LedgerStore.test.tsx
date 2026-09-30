import React from "react";
import { Text } from "react-native";
import { act, render, screen } from "@testing-library/react-native";
import { configureStore } from "@reduxjs/toolkit";
import type { Store } from "redux";
import { payCardAuthSlice, selectCardAuthStatus } from "@features/flow-pay-card-auth/state";
import { getCardSessionToken } from "@features/platform-card";
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
jest.mock("@features/platform-card", () => ({
  ...jest.requireActual("@features/platform-card"),
  getCardSessionToken: jest.fn(async () => null),
}));

// A store without the feature-flags middleware, so the test decides when the cache settles.
const createStore = () => configureStore({ reducer: { featureFlags: featureFlagsReducer } });

const renderProvider = (store: Store) =>
  render(
    <LedgerStoreProvider store={store} onInitFinished={() => {}}>
      {({ ready }) => <Text>{ready ? "ready" : "loading"}</Text>}
    </LedgerStoreProvider>,
  );

describe("LedgerStoreProvider", () => {
  beforeEach(() => {
    mockBootstrapCardSession.mockClear();
    jest.mocked(getCardSessionToken).mockReset();
    jest.mocked(getCardSessionToken).mockResolvedValue(null);
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

  it("should become ready and signed in when a stored card token resolves", async () => {
    let resolveSessionRead!: (token: string) => void;
    jest.mocked(getCardSessionToken).mockReturnValue(
      new Promise(resolve => {
        resolveSessionRead = resolve;
      }),
    );
    const store = configureStore({
      reducer: { featureFlags: featureFlagsReducer, payCardAuth: payCardAuthSlice.reducer },
    });
    store.dispatch(setCachedFlagsSettled());

    renderProvider(store);
    await act(() => jest.runAllTimersAsync());

    expect(screen.getByText("loading")).toBeOnTheScreen();
    expect(selectCardAuthStatus(store.getState())).toBe("unknown");

    await act(async () => {
      resolveSessionRead("at_token");
      await jest.runAllTimersAsync();
    });

    expect(screen.getByText("ready")).toBeOnTheScreen();
    expect(selectCardAuthStatus(store.getState())).toBe("signedIn");
  });
});
