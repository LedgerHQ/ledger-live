import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import React from "react";
import { useWalletSyncUserState } from "../wallet";
import { WalletState } from "@ledgerhq/live-wallet/store";

// Mock minimal state structure
const mockWalletState: WalletState = {
  accountNames: new Map(),
  starredAccountIds: new Set(),
  walletSyncState: {
    data: null,
    version: 0,
  },
  nonImportedAccountInfos: [],
  walletSyncUserState: {
    visualPending: true,
    walletSyncError: new Error("Test error"),
    onUserRefresh: null,
  },
};

describe("useWalletSyncUserState", () => {
  it("should return wallet sync user state from Redux store", () => {
    const store = configureStore({
      reducer: {
        wallet: (state = mockWalletState) => state,
        accounts: (state = []) => state,
        application: (state = {}) => state,
        countervalues: (state = {}) => state,
        devices: (state = {}) => state,
        dynamicContent: (state = {}) => state,
        market: (state = {}) => state,
        modals: (state = {}) => state,
        postOnboarding: (state = {}) => state,
        settings: (state = {}) => state,
        swap: (state = {}) => state,
        trustchain: (state = { trustchain: null, memberCredentials: null }) => state,
        UI: (state = {}) => state,
        walletSync: (state = {}) => state,
        assetsDataApi: (state = {}) => state,
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useWalletSyncUserState(), { wrapper });

    expect(result.current).toEqual({
      visualPending: true,
      walletSyncError: expect.any(Error),
      onUserRefresh: null,
    });
    expect(result.current.walletSyncError?.message).toBe("Test error");
  });

  it("should return default user state when no error is present", () => {
    const mockWalletStateNoError: WalletState = {
      ...mockWalletState,
      walletSyncUserState: {
        visualPending: false,
        walletSyncError: null,
        onUserRefresh: null,
      },
    };

    const store = configureStore({
      reducer: {
        wallet: () => mockWalletStateNoError,
        accounts: (state = []) => state,
        application: (state = {}) => state,
        countervalues: (state = {}) => state,
        devices: (state = {}) => state,
        dynamicContent: (state = {}) => state,
        market: (state = {}) => state,
        modals: (state = {}) => state,
        postOnboarding: (state = {}) => state,
        settings: (state = {}) => state,
        swap: (state = {}) => state,
        trustchain: (state = { trustchain: null, memberCredentials: null }) => state,
        UI: (state = {}) => state,
        walletSync: (state = {}) => state,
        assetsDataApi: (state = {}) => state,
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useWalletSyncUserState(), { wrapper });

    expect(result.current).toEqual({
      visualPending: false,
      walletSyncError: null,
      onUserRefresh: null,
    });
  });
});
