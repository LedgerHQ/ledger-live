import { WalletState } from "@ledgerhq/live-wallet/store";
import { configureStore } from "@reduxjs/toolkit";
import { renderHook } from "@testing-library/react-native";
import React from "react";
import { Provider } from "react-redux";
import { useWalletSyncUserState } from "../wallet";

// Mock minimal state structure for mobile
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
    walletSyncError: new Error("Mobile test error"),
    onUserRefresh: null,
  },
};

describe("Mobile useWalletSyncUserState", () => {
  it("should return wallet sync user state from Redux store", () => {
    const store = configureStore({
      reducer: {
        wallet: (state = mockWalletState) => state,
        accounts: (state = { active: [] }) => state,
        settings: (state = {}) => state,
        countervalues: (state = {}) => state,
        swap: (state = {}) => state,
        market: (state = {}) => state,
        devices: (state = {}) => state,
        trustchain: (state = { trustchain: null, memberCredentials: null }) => state,
        walletSync: (state = {}) => state,
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
    expect(result.current.walletSyncError?.message).toBe("Mobile test error");
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
        accounts: (state = { active: [] }) => state,
        settings: (state = {}) => state,
        countervalues: (state = {}) => state,
        swap: (state = {}) => state,
        market: (state = {}) => state,
        devices: (state = {}) => state,
        trustchain: (state = { trustchain: null, memberCredentials: null }) => state,
        walletSync: (state = {}) => state,
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
