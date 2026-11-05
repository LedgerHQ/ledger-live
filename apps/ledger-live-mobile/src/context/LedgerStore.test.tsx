import React from "react";
import { Text } from "react-native";
import { act, render, screen } from "@testing-library/react-native";
import { configureStore } from "@reduxjs/toolkit";
import type { Store } from "redux";
import { payCardAuthSlice, selectCardAuthStatus } from "@features/flow-pay-card-auth/state";
import { getCardSessionToken } from "@features/platform-card";
import { featureFlagsReducer, setCachedFlagsSettled } from "@shared/feature-flags";
import LedgerStoreProvider from "./LedgerStore";

const mockGetSettings = jest.fn<Promise<unknown>, []>(() => Promise.resolve(undefined));
const mockGetAccounts = jest.fn<Promise<unknown>, []>(() => Promise.resolve(undefined));
const mockGetMarketState = jest.fn<Promise<unknown>, []>(() => Promise.resolve(undefined));
const mockGetKnownDevices = jest.fn<Promise<unknown>, []>(() => Promise.resolve(undefined));
const mockSaveAccounts = jest.fn(() => Promise.resolve());
const mockGetPostOnboardingState = jest.fn<Promise<unknown>, []>(() => Promise.resolve(undefined));
const mockGetFeatureFlagsState = jest.fn<Promise<unknown>, []>(() => Promise.resolve(undefined));
const mockSaveFeatureFlagsState = jest.fn(() => Promise.resolve());

jest.mock("../db", () => {
  const empty = () => Promise.resolve(undefined);
  return {
    getAccounts: () => mockGetAccounts(),
    saveAccounts: () => mockSaveAccounts(),
    getCountervalues: empty,
    getCryptoAssetsCacheState: empty,
    getFeatureFlagsState: () => mockGetFeatureFlagsState(),
    saveFeatureFlagsState: () => mockSaveFeatureFlagsState(),
    getSettings: () => mockGetSettings(),
    getBle: empty,
    getHistory: empty,
    getKnownDevices: () => mockGetKnownDevices(),
    getLargeScreenUpsellModalState: empty,
    getPredictionsState: empty,
    getPostOnboardingState: () => mockGetPostOnboardingState(),
    getProtect: empty,
    getMarketState: () => mockGetMarketState(),
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
const mockBackfillOnboardingDate = jest.fn();
jest.mock("~/logic/postOnboarding/backfillOnboardingDate", () => ({
  backfillOnboardingDate: () => mockBackfillOnboardingDate(),
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

// The error that MMKV `get` rejects with when the stored value is not valid JSON.
const corruptValueError = () => {
  const error = new Error("Unexpected token } in JSON at position 1");
  error.name = "SyntaxError";
  return error;
};

describe("LedgerStoreProvider", () => {
  beforeEach(() => {
    mockGetAccounts.mockReset().mockResolvedValue(undefined);
    mockGetMarketState.mockReset().mockResolvedValue(undefined);
    mockGetKnownDevices.mockReset().mockResolvedValue(undefined);
    mockSaveAccounts.mockClear();
    mockGetPostOnboardingState.mockReset().mockResolvedValue(undefined);
    mockBackfillOnboardingDate.mockClear();
    mockGetFeatureFlagsState.mockReset().mockResolvedValue(undefined);
    mockSaveFeatureFlagsState.mockClear();
    jest.spyOn(console, "error").mockImplementation(() => {});
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

  it("should become ready when 1 key cannot be read", async () => {
    mockGetMarketState.mockRejectedValue(corruptValueError());
    const store = createStore();
    store.dispatch(setCachedFlagsSettled());

    renderProvider(store);
    await act(() => jest.runAllTimersAsync());

    expect(screen.getByText("ready")).toBeOnTheScreen();
    // A retry cannot fix invalid JSON and adds to the storage rollback counter.
    expect(mockGetMarketState).toHaveBeenCalledTimes(1);
  });

  it("should retry a read that fails for another reason", async () => {
    mockGetMarketState.mockRejectedValueOnce(new Error("busy")).mockResolvedValue(undefined);
    const store = createStore();
    store.dispatch(setCachedFlagsSettled());

    renderProvider(store);
    await act(() => jest.runAllTimersAsync());

    expect(screen.getByText("ready")).toBeOnTheScreen();
    expect(mockGetMarketState).toHaveBeenCalledTimes(2);
  });

  it("should stop the boot and not write the accounts when they cannot be read", async () => {
    mockGetAccounts.mockRejectedValue(corruptValueError());
    const store = createStore();
    store.dispatch(setCachedFlagsSettled());
    const onInitFinished = jest.fn();

    render(
      <LedgerStoreProvider store={store} onInitFinished={onInitFinished}>
        {({ ready }) => <Text>{ready ? "ready" : "loading"}</Text>}
      </LedgerStoreProvider>,
    );
    await act(() => jest.runAllTimersAsync());

    // The savers mount only after `ready`, so an empty accounts state never reaches the storage.
    expect(screen.getByText("loading")).toBeOnTheScreen();
    expect(onInitFinished).not.toHaveBeenCalled();
    expect(mockBootstrapCardSession).not.toHaveBeenCalled();
    expect(mockSaveAccounts).not.toHaveBeenCalled();
  });

  it("should stop the boot when the known devices cannot be read", async () => {
    mockGetKnownDevices.mockRejectedValue(corruptValueError());
    const store = createStore();
    store.dispatch(setCachedFlagsSettled());

    renderProvider(store);
    await act(() => jest.runAllTimersAsync());

    // The known devices saver writes at start, so it would replace the stored devices.
    expect(screen.getByText("loading")).toBeOnTheScreen();
    expect(mockBootstrapCardSession).not.toHaveBeenCalled();
  });

  it("should stop the boot when the settings cannot be read", async () => {
    mockGetSettings.mockRejectedValueOnce(corruptValueError());
    const store = createStore();
    store.dispatch(setCachedFlagsSettled());

    renderProvider(store);
    await act(() => jest.runAllTimersAsync());

    // Default settings have no password lock, so the app would open without it.
    expect(screen.getByText("loading")).toBeOnTheScreen();
    expect(mockBootstrapCardSession).not.toHaveBeenCalled();
  });

  it("should not migrate the legacy feature flags over an unreadable value", async () => {
    mockGetFeatureFlagsState.mockRejectedValue(corruptValueError());
    mockGetSettings.mockResolvedValueOnce({
      overriddenFeatureFlags: { someFlag: { enabled: true } },
    });
    const store = createStore();
    store.dispatch(setCachedFlagsSettled());

    renderProvider(store);
    await act(() => jest.runAllTimersAsync());

    expect(screen.getByText("ready")).toBeOnTheScreen();
    expect(mockSaveFeatureFlagsState).not.toHaveBeenCalled();
  });

  it("should not backfill the onboarding date over an unreadable value", async () => {
    mockGetPostOnboardingState.mockRejectedValue(corruptValueError());
    const store = createStore();
    store.dispatch(setCachedFlagsSettled());

    renderProvider(store);
    await act(() => jest.runAllTimersAsync());

    expect(screen.getByText("ready")).toBeOnTheScreen();
    expect(mockBackfillOnboardingDate).not.toHaveBeenCalled();
  });
});
