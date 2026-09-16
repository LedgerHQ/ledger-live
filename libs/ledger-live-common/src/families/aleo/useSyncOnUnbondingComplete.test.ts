/**
 * @jest-environment jsdom
 */
import "../../__tests__/test-helpers/dom-polyfill";
import { renderHook } from "@testing-library/react";
import { useBridgeSync } from "../../bridge/react";
import { useGetLastBlockHeightQuery } from "./state-manager/api";
import { MAX_UNBONDING_SYNC_ATTEMPTS, UNBONDING_SYNC_PRIORITY } from "./constants";
import { useSyncOnUnbondingComplete } from "./react";

jest.mock("../../bridge/react", () => ({ useBridgeSync: jest.fn() }));
jest.mock("./state-manager/api", () => ({
  aleoApi: { reducerPath: "aleoApi" },
  useGetLastBlockHeightQuery: jest.fn(),
}));
jest.mock("../../config/index", () => ({
  getCurrencyConfiguration: jest.fn(() => ({ liveBlockHeightPollMs: 10_000 })),
}));

const mockUseBridgeSync = jest.mocked(useBridgeSync);
const mockUseQuery = jest.mocked(useGetLastBlockHeightQuery);

const ACCOUNT_ID = "js:2:aleo:addr:";
const CURRENCY_ID = "aleo";

/** One successful chain-tip poll, which is what the hook counts as a retry tick. */
const poll = (fulfilledTimeStamp: number | undefined) =>
  mockUseQuery.mockReturnValue({ fulfilledTimeStamp } as unknown as ReturnType<
    typeof useGetLastBlockHeightQuery
  >);

describe("useSyncOnUnbondingComplete", () => {
  let sync: jest.Mock;

  beforeEach(() => {
    sync = jest.fn();
    mockUseBridgeSync.mockReturnValue(sync);
    poll(undefined);
  });

  const render = (settling: boolean) =>
    renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useSyncOnUnbondingComplete(ACCOUNT_ID, CURRENCY_ID, enabled),
      { initialProps: { enabled: settling } },
    );

  it("syncs as soon as the unbonding height is behind the chain, without waiting for a poll", () => {
    render(true);

    expect(sync).toHaveBeenCalledWith({
      type: "SYNC_ONE_ACCOUNT",
      accountId: ACCOUNT_ID,
      priority: UNBONDING_SYNC_PRIORITY,
      reason: "aleo-unbonding-complete",
    });
  });

  it("stays quiet while the countdown is still running", () => {
    render(false);

    expect(sync).not.toHaveBeenCalled();
  });

  it("subscribes to the chain tip only while enabled, so it shares one polling loop", () => {
    render(false);

    expect(mockUseQuery).toHaveBeenLastCalledWith(
      CURRENCY_ID,
      expect.objectContaining({ skip: true }),
    );
  });

  // Without the cap an account the bridge never advances would be synced on every poll, forever.
  it("retries once per fresh chain tip and gives up after the attempt cap", () => {
    const { rerender } = render(true);

    for (let tick = 1; tick <= MAX_UNBONDING_SYNC_ATTEMPTS + 2; tick++) {
      poll(tick);
      rerender({ enabled: true });
    }

    expect(sync).toHaveBeenCalledTimes(MAX_UNBONDING_SYNC_ATTEMPTS);
  });

  it("re-arms the attempts when a later unbonding starts settling", () => {
    const { rerender } = render(true);

    for (let tick = 1; tick <= MAX_UNBONDING_SYNC_ATTEMPTS; tick++) {
      poll(tick);
      rerender({ enabled: true });
    }
    expect(sync).toHaveBeenCalledTimes(MAX_UNBONDING_SYNC_ATTEMPTS);

    rerender({ enabled: false });
    rerender({ enabled: true });

    expect(sync).toHaveBeenCalledTimes(MAX_UNBONDING_SYNC_ATTEMPTS + 1);
  });
});
