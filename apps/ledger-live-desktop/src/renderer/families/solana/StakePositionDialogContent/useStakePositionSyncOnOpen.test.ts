import { act, renderHook } from "@testing-library/react";
import { useAccountSyncState, useBridgeSync } from "@ledgerhq/live-common/bridge/react/index";
import type { Account } from "@ledgerhq/types-live";
import { STAKE_POSITION_SYNC_WAIT_MS } from "@features/flow-stake-position";
import { useStakePositionSyncOnOpen } from "./useStakePositionSyncOnOpen";

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  useAccountSyncState: jest.fn(),
  useBridgeSync: jest.fn(),
}));

const NOW = 1_000_000_000;
const OUTDATED = new Date(NOW - 24 * 60 * 60_000);
const sync = jest.fn();

const accountSyncedAt = (lastSyncDate: Date) =>
  ({ id: "solana-account", lastSyncDate }) as unknown as Account;

function setSyncState(state: { pending: boolean; error?: Error | null }) {
  jest.mocked(useAccountSyncState).mockReturnValue({ pending: state.pending, error: state.error });
}

describe("useStakePositionSyncOnOpen", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
    jest.mocked(useBridgeSync).mockReturnValue(sync);
    setSyncState({ pending: false });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("should sync an outdated account once, and wait for the sync", () => {
    const { result, rerender } = renderHook(() =>
      useStakePositionSyncOnOpen(accountSyncedAt(OUTDATED)),
    );
    rerender();

    expect(sync).toHaveBeenCalledTimes(1);
    expect(sync).toHaveBeenCalledWith(
      expect.objectContaining({ type: "SYNC_ONE_ACCOUNT", accountId: "solana-account" }),
    );
    expect(result.current).toBe(true);
  });

  it("should neither sync nor wait for an account synced recently", () => {
    const { result } = renderHook(() => useStakePositionSyncOnOpen(accountSyncedAt(new Date(NOW))));

    expect(sync).not.toHaveBeenCalled();
    expect(result.current).toBe(false);
  });

  it("should stop waiting once the account is synced", () => {
    const { result, rerender } = renderHook(
      ({ account }: { account: Account }) => useStakePositionSyncOnOpen(account),
      { initialProps: { account: accountSyncedAt(OUTDATED) } },
    );

    rerender({ account: accountSyncedAt(new Date(NOW + 1_000)) });

    expect(result.current).toBe(false);
  });

  it("should stop waiting for a sync that failed", () => {
    const { result, rerender } = renderHook(() =>
      useStakePositionSyncOnOpen(accountSyncedAt(OUTDATED)),
    );

    setSyncState({ pending: false, error: new Error("sync failed") });
    rerender();

    expect(result.current).toBe(false);
  });

  it("should keep waiting until the bound for a sync still queued", () => {
    const { result } = renderHook(() => useStakePositionSyncOnOpen(accountSyncedAt(OUTDATED)));

    act(() => jest.advanceTimersByTime(STAKE_POSITION_SYNC_WAIT_MS - 1));

    expect(result.current).toBe(true);
  });

  it("should stop waiting for a sync still queued after the bound, which may have been dropped", () => {
    const { result } = renderHook(() => useStakePositionSyncOnOpen(accountSyncedAt(OUTDATED)));

    act(() => jest.advanceTimersByTime(STAKE_POSITION_SYNC_WAIT_MS));

    expect(result.current).toBe(false);
  });

  it("should keep waiting for a sync that runs past the bound", () => {
    setSyncState({ pending: true });
    const { result } = renderHook(() => useStakePositionSyncOnOpen(accountSyncedAt(OUTDATED)));

    act(() => jest.advanceTimersByTime(STAKE_POSITION_SYNC_WAIT_MS));

    expect(result.current).toBe(true);
  });
});
