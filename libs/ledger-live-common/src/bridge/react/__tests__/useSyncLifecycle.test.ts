/**
 * @jest-environment jsdom
 */
import "../../../__tests__/test-helpers/dom-polyfill";
import { act, renderHook } from "@testing-library/react";
import { useSyncLifecycle, SYNC_SETTLE_GUARD_MS } from "../useSyncLifecycle";

interface Props {
  isBalanceLoading: boolean;
  stableSyncPending: boolean;
  hasAnySyncError: boolean;
}

function renderPhase(initialProps: Props) {
  return renderHook(
    (props: Props) =>
      useSyncLifecycle(props.isBalanceLoading, props.stableSyncPending, props.hasAnySyncError),
    { initialProps },
  );
}

describe("useSyncLifecycle", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it.each([
    {
      label: "syncing",
      props: { isBalanceLoading: true, stableSyncPending: true, hasAnySyncError: false },
      expected: "syncing",
    },
    {
      label: "synced",
      props: { isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: false },
      expected: "synced",
    },
    {
      label: "failed",
      props: { isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: true },
      expected: "failed",
    },
  ])('initializes to "$expected" given initial state', ({ props, expected }) => {
    const { result } = renderPhase(props);
    expect(result.current).toBe(expected);
  });

  it('blocks in "syncing" during guard period then resolves to "synced" or "failed"', () => {
    const { result, rerender } = renderPhase({
      isBalanceLoading: true,
      stableSyncPending: true,
      hasAnySyncError: false,
    });

    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: false });
    expect(result.current).toBe("syncing");

    act(() => jest.advanceTimersByTime(SYNC_SETTLE_GUARD_MS));
    expect(result.current).toBe("synced");
  });

  it('dispatches "failed" immediately when errors are present at settle edge', () => {
    const { result, rerender } = renderPhase({
      isBalanceLoading: true,
      stableSyncPending: true,
      hasAnySyncError: false,
    });

    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: true });
    expect(result.current).toBe("failed");
  });

  it('dispatches "failed" when errors appear during the guard period', () => {
    const { result, rerender } = renderPhase({
      isBalanceLoading: true,
      stableSyncPending: true,
      hasAnySyncError: false,
    });

    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: false });
    expect(result.current).toBe("syncing");

    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: true });
    expect(result.current).toBe("syncing");

    act(() => jest.advanceTimersByTime(SYNC_SETTLE_GUARD_MS));
    expect(result.current).toBe("failed");
  });

  it('stays "syncing" while stableSyncPending is true even if isBalanceLoading goes false', () => {
    const { result, rerender } = renderPhase({
      isBalanceLoading: true,
      stableSyncPending: true,
      hasAnySyncError: false,
    });

    rerender({ isBalanceLoading: false, stableSyncPending: true, hasAnySyncError: false });
    expect(result.current).toBe("syncing");
  });

  it("resets the guard timer when isSyncSettled bounces (false → true → false → true)", () => {
    const { result, rerender } = renderPhase({
      isBalanceLoading: true,
      stableSyncPending: true,
      hasAnySyncError: false,
    });

    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: false });
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current).toBe("syncing");

    rerender({ isBalanceLoading: false, stableSyncPending: true, hasAnySyncError: false });
    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: true });
    expect(result.current).toBe("failed");
  });

  it("absorbs bouncing settle and dispatches correct final state", () => {
    const { result, rerender } = renderPhase({
      isBalanceLoading: true,
      stableSyncPending: true,
      hasAnySyncError: false,
    });

    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: false });
    rerender({ isBalanceLoading: false, stableSyncPending: true, hasAnySyncError: false });
    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: false });
    expect(result.current).toBe("syncing");

    act(() => jest.advanceTimersByTime(SYNC_SETTLE_GUARD_MS));
    expect(result.current).toBe("synced");
  });

  it("does NOT flash syncing → synced → failed when error appears after settle", () => {
    const states: string[] = [];
    const { result, rerender } = renderPhase({
      isBalanceLoading: true,
      stableSyncPending: true,
      hasAnySyncError: false,
    });
    states.push(result.current);

    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: false });
    states.push(result.current);

    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: true });
    states.push(result.current);

    act(() => jest.advanceTimersByTime(SYNC_SETTLE_GUARD_MS));
    states.push(result.current);

    expect(states).toEqual(["syncing", "syncing", "syncing", "failed"]);
  });

  it("does NOT flash failed → synced → failed on manual refresh with persistent errors", () => {
    const { result, rerender } = renderPhase({
      isBalanceLoading: false,
      stableSyncPending: false,
      hasAnySyncError: true,
    });
    expect(result.current).toBe("failed");

    rerender({ isBalanceLoading: true, stableSyncPending: true, hasAnySyncError: true });
    expect(result.current).toBe("syncing");

    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: true });
    expect(result.current).toBe("failed");
  });

  it("does NOT flash loading → error → ok → error on manual refresh", () => {
    const states: string[] = [];
    const { result, rerender } = renderPhase({
      isBalanceLoading: false,
      stableSyncPending: false,
      hasAnySyncError: false,
    });
    states.push(result.current);

    rerender({ isBalanceLoading: true, stableSyncPending: true, hasAnySyncError: false });
    states.push(result.current);

    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: false });
    states.push(result.current);

    rerender({ isBalanceLoading: false, stableSyncPending: true, hasAnySyncError: false });
    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: true });
    states.push(result.current);

    expect(states).toEqual(["synced", "syncing", "syncing", "failed"]);
  });

  it.each([
    {
      from: "synced",
      initialProps: { isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: false },
    },
    {
      from: "failed",
      initialProps: { isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: true },
    },
  ])(
    'transitions from "$from" back to "syncing" when user triggers refresh',
    ({ initialProps }) => {
      const { result, rerender } = renderPhase(initialProps);

      rerender({
        isBalanceLoading: true,
        stableSyncPending: true,
        hasAnySyncError: initialProps.hasAnySyncError,
      });
      expect(result.current).toBe("syncing");
    },
  );

  it("handles auto-refresh cycle: stays synced during poll, transitions on settle", () => {
    const { result, rerender } = renderPhase({
      isBalanceLoading: false,
      stableSyncPending: false,
      hasAnySyncError: false,
    });
    expect(result.current).toBe("synced");

    rerender({ isBalanceLoading: false, stableSyncPending: true, hasAnySyncError: false });
    expect(result.current).toBe("synced");

    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: true });
    expect(result.current).toBe("failed");

    rerender({ isBalanceLoading: false, stableSyncPending: true, hasAnySyncError: true });
    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: false });
    expect(result.current).toBe("synced");
  });
});
