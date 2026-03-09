/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, renderHook } from "tests/testSetup";
import { WalletSyncProvider, useWalletSyncUserState } from "../components/WalletSyncContext";

jest.mock("../hooks/useWatchWalletSync", () => ({
  useWatchWalletSync: jest.fn(() => ({
    visualPending: false,
    walletSyncError: null,
    onUserRefresh: jest.fn(),
  })),
}));

describe("WalletSyncContext", () => {
  it("should provide default context value when used outside provider", () => {
    const { result } = renderHook(() => useWalletSyncUserState());
    expect(result.current.visualPending).toBe(false);
    expect(result.current.walletSyncError).toBe(null);
    expect(result.current.onUserRefresh).toEqual(expect.any(Function));
  });

  it("should provide wallet sync state from useWatchWalletSync when inside provider", () => {
    const mockOnUserRefresh = jest.fn();
    const useWatchWalletSync = jest.requireMock("../hooks/useWatchWalletSync").useWatchWalletSync;
    useWatchWalletSync.mockReturnValue({
      visualPending: true,
      walletSyncError: new Error("Sync failed"),
      onUserRefresh: mockOnUserRefresh,
    });

    const Consumer = () => {
      const state = useWalletSyncUserState();
      return (
        <>
          <span data-testid="pending">{String(state.visualPending)}</span>
          <span data-testid="error">{state.walletSyncError?.message ?? "none"}</span>
          <button type="button" onClick={state.onUserRefresh}>
            Refresh
          </button>
        </>
      );
    };

    render(
      <WalletSyncProvider>
        <Consumer />
      </WalletSyncProvider>,
    );

    expect(screen.getByTestId("pending")).toHaveTextContent("true");
    expect(screen.getByTestId("error")).toHaveTextContent("Sync failed");
    screen.getByRole("button", { name: "Refresh" }).click();
    expect(mockOnUserRefresh).toHaveBeenCalledTimes(1);
  });
});
