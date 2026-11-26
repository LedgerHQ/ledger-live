/**
 * @jest-environment jsdom
 */
import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { WalletSyncContext } from "../walletSyncContext";
import { useLedgerSyncLoadingSettled } from "./useLedgerSyncLoadingSettled";

let visualPending = false;

function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return createElement(
    WalletSyncContext.Provider,
    { value: { visualPending, walletSyncError: null, onUserRefresh: jest.fn() } },
    children,
  );
}

beforeEach(() => {
  visualPending = false;
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

describe("useLedgerSyncLoadingSettled", () => {
  it("should settle 2.5 seconds after mount with the default initial timeout", () => {
    const { result } = renderHook(() => useLedgerSyncLoadingSettled(undefined));

    act(() => jest.advanceTimersByTime(2499));
    expect(result.current).toBe(false);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe(true);
  });

  it("should wait the app's initial timeout plus 1.5 seconds", () => {
    const { result } = renderHook(() => useLedgerSyncLoadingSettled(4000));

    act(() => jest.advanceTimersByTime(5499));
    expect(result.current).toBe(false);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe(true);
  });

  it("should settle only once the visibly pending cycle ends", () => {
    visualPending = true;
    const { result, rerender } = renderHook(() => useLedgerSyncLoadingSettled(undefined), {
      wrapper: Wrapper,
    });

    act(() => jest.advanceTimersByTime(10_000));
    expect(result.current).toBe(false);

    visualPending = false;
    rerender();
    expect(result.current).toBe(true);
  });
});
