import React from "react";
import { AppState, type AppStateStatus, type NativeEventSubscription } from "react-native";
import { act, renderHook } from "@testing-library/react-native";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import {
  payCardOnboardingWidgetSlice,
  selectDigitalWalletProvisioningStartedAt,
  startDigitalWalletProvisioning,
} from "@features/flow-pay-card-widget/state";

jest.mock("@domain/api-card-management", () => ({ useGetCardStatusQuery: jest.fn() }));

import { useGetCardStatusQuery } from "@domain/api-card-management";
import { useCardStatusRefresh } from "./useCardStatusRefresh";

const NOW = 1_700_000_000_000;
const refetch = jest.fn();
const removeAppStateListener = jest.fn();
let appStateListener: ((state: AppStateStatus) => void) | undefined;
let store: ReturnType<typeof makeStore>;

function makeStore() {
  return configureStore({
    reducer: { payCardOnboardingWidget: payCardOnboardingWidgetSlice.reducer },
  });
}

function setCardStatus({
  cardAddedToDigitalWallet,
  fulfilledTimeStamp = NOW,
}: { cardAddedToDigitalWallet?: boolean; fulfilledTimeStamp?: number } = {}) {
  jest.mocked(useGetCardStatusQuery).mockReturnValue({
    data: { cardAddedToDigitalWallet },
    refetch,
    fulfilledTimeStamp,
  } as unknown as ReturnType<typeof useGetCardStatusQuery>);
}

function setAppState(state: AppStateStatus) {
  Object.defineProperty(AppState, "currentState", { value: state, configurable: true });
}

function provisioningStartedAt() {
  return selectDigitalWalletProvisioningStartedAt(store.getState());
}

function renderRefresh({ skip = false }: { skip?: boolean } = {}) {
  return renderHook(({ skip }: { skip: boolean }) => useCardStatusRefresh({ skip }), {
    initialProps: { skip },
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  });
}

function startProvisioning() {
  act(() => {
    store.dispatch(startDigitalWalletProvisioning());
  });
}

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

describe("useCardStatusRefresh (native)", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
    jest.clearAllMocks();
    store = makeStore();
    appStateListener = undefined;
    setAppState("active");
    setCardStatus();
    jest.mocked(AppState.addEventListener).mockImplementation((_type, listener) => {
      appStateListener = listener;
      return { remove: removeAppStateListener } as NativeEventSubscription;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("after the holder is back from the wallet", () => {
    it("does not re-read while nothing is pending", () => {
      renderRefresh();

      advance(60_000);

      expect(refetch).not.toHaveBeenCalled();
    });

    it("re-reads at once, then backs off", () => {
      renderRefresh();

      startProvisioning();
      expect(refetch).toHaveBeenCalledTimes(1);

      advance(2_999);
      expect(refetch).toHaveBeenCalledTimes(1);
      advance(1);
      expect(refetch).toHaveBeenCalledTimes(2);

      advance(5_000);
      expect(refetch).toHaveBeenCalledTimes(3);

      advance(10_000);
      expect(refetch).toHaveBeenCalledTimes(4);

      advance(15_000);
      expect(refetch).toHaveBeenCalledTimes(5);

      advance(30_000);
      expect(refetch).toHaveBeenCalledTimes(6);
    });

    it("gives up three minutes after the holder came back", () => {
      renderRefresh();
      startProvisioning();

      advance(179_999);
      expect(provisioningStartedAt()).not.toBeNull();

      advance(1);
      expect(provisioningStartedAt()).toBeNull();

      const readsAtDeadline = refetch.mock.calls.length;
      advance(120_000);
      expect(refetch).toHaveBeenCalledTimes(readsAtDeadline);
    });

    it("stops once the provider reports the card in the wallet", () => {
      const { rerender } = renderRefresh();
      startProvisioning();
      advance(3_000);
      expect(refetch).toHaveBeenCalledTimes(2);

      setCardStatus({ cardAddedToDigitalWallet: true });
      rerender({ skip: false });

      expect(provisioningStartedAt()).toBeNull();
      advance(60_000);
      expect(refetch).toHaveBeenCalledTimes(2);
    });

    it("stops when the holder signs out", () => {
      const { rerender } = renderRefresh();
      startProvisioning();

      rerender({ skip: true });

      expect(provisioningStartedAt()).toBeNull();
      advance(60_000);
      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it("skips the scheduled re-reads while the app is in the background", () => {
      renderRefresh();
      startProvisioning();
      setAppState("background");

      advance(18_000);

      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it("re-reads as soon as the app is back in the foreground, however fresh the status", () => {
      renderRefresh();
      startProvisioning();
      refetch.mockClear();

      act(() => appStateListener?.("active"));

      expect(refetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("when the app comes back to the foreground", () => {
    it("re-reads a status older than thirty seconds", () => {
      setCardStatus({ fulfilledTimeStamp: NOW - 30_000 });
      renderRefresh();

      act(() => appStateListener?.("active"));

      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it("keeps a fresh status", () => {
      setCardStatus({ fulfilledTimeStamp: NOW - 29_999 });
      renderRefresh();

      act(() => appStateListener?.("active"));

      expect(refetch).not.toHaveBeenCalled();
    });

    it("ignores the app leaving the foreground", () => {
      setCardStatus({ fulfilledTimeStamp: NOW - 60_000 });
      renderRefresh();

      act(() => appStateListener?.("background"));

      expect(refetch).not.toHaveBeenCalled();
    });

    it("does not listen while signed out", () => {
      renderRefresh({ skip: true });

      expect(AppState.addEventListener).not.toHaveBeenCalled();
    });

    it("stops listening on unmount", () => {
      const { unmount } = renderRefresh();

      unmount();

      expect(removeAppStateListener).toHaveBeenCalled();
    });
  });
});
