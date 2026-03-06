import { act, renderHook } from "tests/testSetup";
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

  // --- Initialization ---

  it('initializes to "syncing" when isBalanceLoading is true', () => {
    const { result } = renderPhase({
      isBalanceLoading: true,
      stableSyncPending: true,
      hasAnySyncError: false,
    });
    expect(result.current).toBe("syncing");
  });

  it('initializes to "synced" when settled with no errors', () => {
    const { result } = renderPhase({
      isBalanceLoading: false,
      stableSyncPending: false,
      hasAnySyncError: false,
    });
    expect(result.current).toBe("synced");
  });

  it('initializes to "failed" when settled with errors', () => {
    const { result } = renderPhase({
      isBalanceLoading: false,
      stableSyncPending: false,
      hasAnySyncError: true,
    });
    expect(result.current).toBe("failed");
  });

  // --- Cold start / manual refresh (from syncing) ---

  it("stays syncing during the settle guard period when no errors", () => {
    const { result, rerender } = renderPhase({
      isBalanceLoading: true,
      stableSyncPending: true,
      hasAnySyncError: false,
    });
    expect(result.current).toBe("syncing");

    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: false });
    expect(result.current).toBe("syncing");
  });

  it('transitions to "synced" after the settle guard expires with no errors', () => {
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

  it('transitions to "failed" immediately when errors are present at the settle edge', () => {
    const { result, rerender } = renderPhase({
      isBalanceLoading: true,
      stableSyncPending: true,
      hasAnySyncError: false,
    });
    expect(result.current).toBe("syncing");

    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: true });
    expect(result.current).toBe("failed");
  });

  it('transitions to "failed" when errors appear during the guard period', () => {
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

  // --- Bouncing settle (sub-account discovery / retry) ---

  it("resets the guard timer when isSyncSettled bounces (false → true → false → true)", () => {
    const { result, rerender } = renderPhase({
      isBalanceLoading: true,
      stableSyncPending: true,
      hasAnySyncError: false,
    });

    // First settle — guard starts
    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: false });
    expect(result.current).toBe("syncing");

    // Advance part of the guard
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current).toBe("syncing");

    // Second sync cycle starts — guard cancelled
    rerender({ isBalanceLoading: false, stableSyncPending: true, hasAnySyncError: false });
    expect(result.current).toBe("syncing");

    // Second sync finishes with errors — guard restarts, immediate dispatch
    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: true });
    expect(result.current).toBe("failed");
  });

  it("absorbs bouncing settle and dispatches correct final state", () => {
    const { result, rerender } = renderPhase({
      isBalanceLoading: true,
      stableSyncPending: true,
      hasAnySyncError: false,
    });

    // First settle — no errors
    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: false });
    expect(result.current).toBe("syncing");

    // Bounce — new sync
    rerender({ isBalanceLoading: false, stableSyncPending: true, hasAnySyncError: false });

    // Second settle — still no errors, new guard
    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: false });
    expect(result.current).toBe("syncing");

    // Guard expires
    act(() => jest.advanceTimersByTime(SYNC_SETTLE_GUARD_MS));
    expect(result.current).toBe("synced");
  });

  // --- CORE GUARANTEE: no syncing → synced → failed flash ---

  it("does NOT flash syncing → synced → failed when error appears after settle", () => {
    const states: string[] = [];
    const { result, rerender } = renderPhase({
      isBalanceLoading: true,
      stableSyncPending: true,
      hasAnySyncError: false,
    });
    states.push(result.current);

    // Settle without errors
    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: false });
    states.push(result.current);

    // Error appears while still in guard period
    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: true });
    states.push(result.current);

    // Guard expires — reads latest error via ref
    act(() => jest.advanceTimersByTime(SYNC_SETTLE_GUARD_MS));
    states.push(result.current);

    // Must never have been "synced" at any point
    expect(states).toEqual(["syncing", "syncing", "syncing", "failed"]);
  });

  it("does NOT flash failed → synced → failed on manual refresh with persistent errors", () => {
    const { result, rerender } = renderPhase({
      isBalanceLoading: false,
      stableSyncPending: false,
      hasAnySyncError: true,
    });
    expect(result.current).toBe("failed");

    // User clicks retry
    rerender({ isBalanceLoading: true, stableSyncPending: true, hasAnySyncError: true });
    expect(result.current).toBe("syncing");

    // Sync settles — errors still present → immediate dispatch
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

    // User clicks refresh
    rerender({ isBalanceLoading: true, stableSyncPending: true, hasAnySyncError: false });
    states.push(result.current);

    // Settle without errors — guard starts
    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: false });
    states.push(result.current);

    // Bounce — second sync
    rerender({ isBalanceLoading: false, stableSyncPending: true, hasAnySyncError: false });

    // Second sync settles with errors → immediate dispatch
    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: true });
    states.push(result.current);

    expect(states).toEqual(["synced", "syncing", "syncing", "failed"]);
  });

  // --- Manual refresh / retry ---

  it('transitions from "synced" back to "syncing" on manual refresh', () => {
    const { result, rerender } = renderPhase({
      isBalanceLoading: false,
      stableSyncPending: false,
      hasAnySyncError: false,
    });
    expect(result.current).toBe("synced");

    rerender({ isBalanceLoading: true, stableSyncPending: true, hasAnySyncError: false });
    expect(result.current).toBe("syncing");
  });

  it('transitions from "failed" back to "syncing" on retry', () => {
    const { result, rerender } = renderPhase({
      isBalanceLoading: false,
      stableSyncPending: false,
      hasAnySyncError: true,
    });
    expect(result.current).toBe("failed");

    rerender({ isBalanceLoading: true, stableSyncPending: true, hasAnySyncError: true });
    expect(result.current).toBe("syncing");
  });

  // --- Auto-refresh (no syncing phase) ---

  it('stays "synced" during background auto-poll pending', () => {
    const { result, rerender } = renderPhase({
      isBalanceLoading: false,
      stableSyncPending: false,
      hasAnySyncError: false,
    });
    expect(result.current).toBe("synced");

    rerender({ isBalanceLoading: false, stableSyncPending: true, hasAnySyncError: false });
    expect(result.current).toBe("synced");
  });

  it('transitions from "synced" to "failed" on auto-refresh settle with errors', () => {
    const { result, rerender } = renderPhase({
      isBalanceLoading: false,
      stableSyncPending: false,
      hasAnySyncError: false,
    });

    rerender({ isBalanceLoading: false, stableSyncPending: true, hasAnySyncError: false });

    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: true });
    expect(result.current).toBe("failed");
  });

  it('transitions from "failed" to "synced" on auto-refresh when errors clear', () => {
    const { result, rerender } = renderPhase({
      isBalanceLoading: false,
      stableSyncPending: false,
      hasAnySyncError: true,
    });
    expect(result.current).toBe("failed");

    rerender({ isBalanceLoading: false, stableSyncPending: true, hasAnySyncError: true });

    rerender({ isBalanceLoading: false, stableSyncPending: false, hasAnySyncError: false });
    expect(result.current).toBe("synced");
  });

  // --- Edge: stableSyncPending still true after isBalanceLoading goes false ---

  it('stays "syncing" while stableSyncPending is true even if isBalanceLoading goes false', () => {
    const { result, rerender } = renderPhase({
      isBalanceLoading: true,
      stableSyncPending: true,
      hasAnySyncError: false,
    });
    expect(result.current).toBe("syncing");

    rerender({ isBalanceLoading: false, stableSyncPending: true, hasAnySyncError: false });
    expect(result.current).toBe("syncing");
  });
});
