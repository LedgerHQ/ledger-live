/**
 * @jest-environment jsdom
 */
import { createElement, type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { WalletSyncContext } from "../walletSyncContext";
import { useWalletSyncUserState } from "./useWalletSyncUserState";

describe("useWalletSyncUserState", () => {
  it("should report nothing pending and no error without a provider", () => {
    const { result } = renderHook(() => useWalletSyncUserState());
    expect(result.current.visualPending).toBe(false);
    expect(result.current.walletSyncError).toBeNull();
    expect(() => result.current.onUserRefresh()).not.toThrow();
  });

  it("should read the state the app provides", () => {
    const state = {
      visualPending: true,
      walletSyncError: new Error("x"),
      onUserRefresh: jest.fn(),
    };
    function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
      return createElement(WalletSyncContext.Provider, { value: state }, children);
    }
    const { result } = renderHook(() => useWalletSyncUserState(), { wrapper: Wrapper });
    expect(result.current).toBe(state);
  });
});
