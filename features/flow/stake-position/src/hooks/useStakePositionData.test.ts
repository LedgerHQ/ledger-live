import { act, renderHook } from "@testing-library/react";
import type { z } from "zod";
import { useGetEarnPositionsQuery, useRefreshEarnPositions } from "@domain/api-earn-positions";
import type { EarnPositionSchema, EarnPositions } from "@domain/entity-earn-position";
import { mockEarnPosition, mockEarnPositions } from "@domain/entity-earn-position/schema.mock";
import { abandonStakePosition } from "../stakePositionRequestStore";
import {
  getStakePositionRequest,
  requestStakePosition,
} from "../stakePositionRequestStore.internals";
import { markStakePositionTransacted } from "../stakePositionTransactions";
import {
  POLL_INTERVAL_MS,
  POLL_TIMEOUT_MS,
  STALE_REREAD_DELAY_MS,
  TRANSACTED_WINDOW_MS,
  clearStakePositionTransaction,
} from "../stakePositionTransactions.internals";
import type { StakePositionOrigin } from "../types";
import { useStakePositionData, type UseStakePositionDataInput } from "./useStakePositionData";

jest.mock("@domain/api-earn-positions", () => ({
  useGetEarnPositionsQuery: jest.fn(),
  useRefreshEarnPositions: jest.fn(),
}));

const NETWORK = "solana";
const OWNER_ADDRESS = "Wa11etTestAddress1111111111111111111111111111";
const POSITION_ID = "StakeAccountA1111111111111111111111111111111";
const VALIDATOR = "26pV97Ce83ZQ6Kz9XT4td8tdoUFPTng8Fb8gPyc53dJx";
const POSITION = { ownerAddress: OWNER_ADDRESS, positionId: POSITION_ID };
const NOW = 1_000_000;
/** The time of a read that ended before the surface opened. */
const BEFORE_OPEN = NOW - 60_000;

type PositionsQueryState = {
  data?: EarnPositions;
  isError: boolean;
  isFetching?: boolean;
  startedTimeStamp?: number;
  /** When the cached data was read. Defaults to now: a read of this open. */
  fulfilledTimeStamp?: number;
};

const refetch = jest.fn();
const refreshEarnPositions = jest.fn();
let positionsQuery: PositionsQueryState;

const mockPositionsQuery = jest.mocked(useGetEarnPositionsQuery);

const positionsWith = (overrides?: Partial<z.input<typeof EarnPositionSchema>>) =>
  mockEarnPositions({
    positions: [mockEarnPosition({ id: POSITION_ID, validatorAddress: VALIDATOR, ...overrides })],
  });

const stale = (overrides?: Partial<z.input<typeof EarnPositionSchema>>) => ({
  ...positionsWith(overrides),
  isStale: true,
});
const lastPositionsQueryCall = () => mockPositionsQuery.mock.lastCall;

const INPUT: UseStakePositionDataInput = {
  request: { id: -1, origin: "account", positionId: POSITION_ID },
  isOpen: true,
  network: NETWORK,
  ownerAddress: OWNER_ADDRESS,
};

function openRequest(origin: StakePositionOrigin) {
  const onResult = jest.fn();
  act(() => {
    void requestStakePosition(
      { accountId: "host-account-id", positionId: POSITION_ID, origin },
      Symbol("player"),
    ).then(onResult);
  });
  const id = getStakePositionRequest()?.shown.id ?? -1;
  return { id, onResult };
}

function renderData(overrides: Partial<UseStakePositionDataInput> = {}) {
  const input: UseStakePositionDataInput = { ...INPUT, ...overrides };
  const hook = renderHook((props: UseStakePositionDataInput) => useStakePositionData(props), {
    initialProps: input,
  });
  const rerenderWith = (state: PositionsQueryState) => {
    positionsQuery = state;
    hook.rerender(input);
  };
  return { ...hook, rerenderWith };
}

const flushPromises = () => act(() => jest.advanceTimersByTimeAsync(0));

describe("useStakePositionData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: NOW });
    positionsQuery = { data: positionsWith(), isError: false };
    mockPositionsQuery.mockImplementation((() => ({
      isFetching: false,
      fulfilledTimeStamp: Date.now(),
      ...positionsQuery,
      refetch,
    })) as unknown as typeof useGetEarnPositionsQuery);
    // Like the query: a read again keeps the data it has and starts fetching.
    refetch.mockImplementation(() => {
      positionsQuery = {
        fulfilledTimeStamp: NOW,
        ...positionsQuery,
        isFetching: true,
        startedTimeStamp: Date.now(),
      };
    });
    jest.mocked(useRefreshEarnPositions).mockReturnValue(refreshEarnPositions);
  });

  afterEach(() => {
    act(() => clearStakePositionTransaction(POSITION));
    const request = getStakePositionRequest();
    if (request) act(() => abandonStakePosition(request.shown.id));
    jest.useRealTimers();
  });

  it("should read the positions of the owner address, again on each open, without polling", () => {
    renderData();

    expect(lastPositionsQueryCall()).toEqual([
      { network: NETWORK, address: OWNER_ADDRESS, fresh: false },
      { refetchOnMountOrArgChange: 30, pollingInterval: 0 },
    ]);
  });

  it("should be loading until the positions arrive", () => {
    positionsQuery = { data: undefined, isError: false, isFetching: true };

    const { result } = renderData();

    expect(result.current).toEqual({ kind: "loading" });
  });

  it("should show the position with its own rate", () => {
    const { result } = renderData();

    expect(result.current).toMatchObject({
      kind: "ready",
      status: "active",
      position: { interest: { type: "APY", value: 0.0712 } },
      isStale: false,
      isPolling: false,
    });
  });

  describe("on a wallet screen", () => {
    it("should fail with a retry that reads the positions again", () => {
      positionsQuery = { data: undefined, isError: true, startedTimeStamp: NOW };
      const { result } = renderData();

      expect(result.current).toMatchObject({ kind: "error" });
      if (result.current.kind === "error") result.current.retry();
      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it("should show a position the backend does not report as not found, and keep the request open", async () => {
      const request = openRequest("account");
      positionsQuery = { data: mockEarnPositions({ positions: [] }), isError: false };

      const { result } = renderData({
        request: { id: request.id, origin: "account", positionId: POSITION_ID },
      });
      await flushPromises();

      expect(result.current).toEqual({ kind: "notFound" });
      expect(request.onResult).not.toHaveBeenCalled();
      expect(getStakePositionRequest()?.phase).toBe("open");
    });

    it("should fail, not miss the position, when the read of this open fails on older positions without it", () => {
      positionsQuery = {
        data: mockEarnPositions({ positions: [] }),
        isError: true,
        startedTimeStamp: NOW,
        fulfilledTimeStamp: BEFORE_OPEN,
      };

      const { result } = renderData();

      expect(result.current).toMatchObject({ kind: "error" });
    });
  });

  describe("for the Earn live app", () => {
    it.each([
      ["fails to load", { data: undefined, isError: true, startedTimeStamp: NOW }],
      ["is not reported", { data: mockEarnPositions({ positions: [] }), isError: false }],
      [
        "is missing behind a provider failure",
        {
          data: mockEarnPositions({
            positions: [],
            failures: [{ code: 503, reason: "Provider unavailable" }],
          }),
          isError: false,
        },
      ],
      ["is closed", { data: positionsWith({ status: "archived" }), isError: false }],
    ])(
      "should close the request and answer it unavailable when the position %s",
      async (_case, state) => {
        const request = openRequest("earn");
        positionsQuery = state;

        const { result } = renderData({
          request: { id: request.id, origin: "earn", positionId: POSITION_ID },
        });
        await flushPromises();

        expect(result.current).toEqual({ kind: "unavailable" });
        expect(request.onResult).toHaveBeenCalledWith({ action: null, reason: "unavailable" });
        expect(getStakePositionRequest()).toBeNull();
      },
    );

    it("should show a position it can read", async () => {
      const request = openRequest("earn");

      const { result } = renderData({
        request: { id: request.id, origin: "earn", positionId: POSITION_ID },
      });
      await flushPromises();

      expect(result.current).toMatchObject({ kind: "ready" });
      expect(request.onResult).not.toHaveBeenCalled();
    });
  });

  describe("a conclusion waits for a read of this open", () => {
    const CACHED_WITHOUT_ROW: PositionsQueryState = {
      data: mockEarnPositions({ positions: [] }),
      isError: false,
      fulfilledTimeStamp: BEFORE_OPEN,
      startedTimeStamp: BEFORE_OPEN,
    };

    it("should keep loading, without answering Earn, while the read of this open runs", async () => {
      const request = openRequest("earn");
      positionsQuery = { ...CACHED_WITHOUT_ROW, isFetching: true, startedTimeStamp: NOW };

      const { result, rerenderWith } = renderData({
        request: { id: request.id, origin: "earn", positionId: POSITION_ID },
      });
      await flushPromises();

      expect(result.current).toEqual({ kind: "loading" });
      expect(request.onResult).not.toHaveBeenCalled();

      rerenderWith({ data: positionsWith(), isError: false, fulfilledTimeStamp: NOW + 1 });

      expect(result.current).toMatchObject({ kind: "ready" });
      expect(request.onResult).not.toHaveBeenCalled();
    });

    it("should read again, then conclude, when positions cached before this open lack the position", async () => {
      const request = openRequest("earn");
      positionsQuery = CACHED_WITHOUT_ROW;

      const { result, rerenderWith } = renderData({
        request: { id: request.id, origin: "earn", positionId: POSITION_ID },
      });
      await flushPromises();

      expect(refetch).toHaveBeenCalledTimes(1);
      expect(result.current).toEqual({ kind: "loading" });
      expect(request.onResult).not.toHaveBeenCalled();

      rerenderWith({ ...CACHED_WITHOUT_ROW, isFetching: true, startedTimeStamp: NOW });
      rerenderWith({ ...CACHED_WITHOUT_ROW, fulfilledTimeStamp: NOW, startedTimeStamp: NOW });
      await flushPromises();

      expect(refetch).toHaveBeenCalledTimes(1);
      expect(request.onResult).toHaveBeenCalledWith({ action: null, reason: "unavailable" });
    });

    it("should show cached positions that hold the position at once, without reading again", () => {
      positionsQuery = { ...CACHED_WITHOUT_ROW, data: positionsWith() };

      const { result } = renderData();

      expect(result.current).toMatchObject({ kind: "ready" });
      expect(refetch).not.toHaveBeenCalled();
    });

    it("should not read again while the surface is closed", () => {
      positionsQuery = CACHED_WITHOUT_ROW;

      renderData({ isOpen: false });

      expect(refetch).not.toHaveBeenCalled();
    });
  });

  describe("a stale snapshot", () => {
    it("should be read once more a few seconds later, and no more", () => {
      positionsQuery = { data: stale(), isError: false };
      const { result, rerenderWith } = renderData();

      expect(result.current).toMatchObject({ kind: "ready", isStale: true });
      act(() => jest.advanceTimersByTime(STALE_REREAD_DELAY_MS - 1));
      expect(refetch).not.toHaveBeenCalled();
      act(() => jest.advanceTimersByTime(1));
      expect(refetch).toHaveBeenCalledTimes(1);

      rerenderWith({ data: stale(), isError: false, fulfilledTimeStamp: Date.now() + 1 });
      act(() => jest.advanceTimersByTime(STALE_REREAD_DELAY_MS * 2));

      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it("should stop saying the position is updating once the read again is fresh", () => {
      positionsQuery = { data: stale(), isError: false };
      const { result, rerenderWith } = renderData();
      act(() => jest.advanceTimersByTime(STALE_REREAD_DELAY_MS));

      rerenderWith({ data: positionsWith(), isError: false, fulfilledTimeStamp: Date.now() + 1 });

      expect(result.current).toMatchObject({ kind: "ready", isStale: false });
    });

    it("should keep loading a stale snapshot without the position until its second read", async () => {
      const request = openRequest("earn");
      const staleWithoutRow = { ...mockEarnPositions({ positions: [] }), isStale: true };
      positionsQuery = { data: staleWithoutRow, isError: false, fulfilledTimeStamp: NOW };
      const { result, rerenderWith } = renderData({
        request: { id: request.id, origin: "earn", positionId: POSITION_ID },
      });
      await flushPromises();

      expect(result.current).toEqual({ kind: "loading" });
      act(() => jest.advanceTimersByTime(STALE_REREAD_DELAY_MS));
      expect(refetch).toHaveBeenCalledTimes(1);
      expect(result.current).toEqual({ kind: "loading" });
      expect(request.onResult).not.toHaveBeenCalled();

      rerenderWith({ data: positionsWith(), isError: false, fulfilledTimeStamp: Date.now() });
      await flushPromises();

      expect(result.current).toMatchObject({ kind: "ready" });
      expect(request.onResult).not.toHaveBeenCalled();
    });

    it("should conclude once its second read still lacks the position", async () => {
      const request = openRequest("earn");
      const staleWithoutRow = { ...mockEarnPositions({ positions: [] }), isStale: true };
      positionsQuery = { data: staleWithoutRow, isError: false, fulfilledTimeStamp: NOW };
      const { rerenderWith } = renderData({
        request: { id: request.id, origin: "earn", positionId: POSITION_ID },
      });
      act(() => jest.advanceTimersByTime(STALE_REREAD_DELAY_MS));

      rerenderWith({ data: staleWithoutRow, isError: false, fulfilledTimeStamp: Date.now() });
      await flushPromises();

      expect(request.onResult).toHaveBeenCalledWith({ action: null, reason: "unavailable" });
    });
  });

  describe("after the user's own transaction", () => {
    it("should read fresh positions and poll them while the backend shows the position as before", () => {
      markStakePositionTransacted({ ...POSITION, action: "deactivate" });

      const { result } = renderData();

      expect(lastPositionsQueryCall()).toEqual([
        { network: NETWORK, address: OWNER_ADDRESS, fresh: true },
        { refetchOnMountOrArgChange: 30, pollingInterval: POLL_INTERVAL_MS },
      ]);
      expect(result.current).toMatchObject({ kind: "ready", isPolling: true });
    });

    it("should read fresh and poll once the transaction is recorded while the surface shows the position", () => {
      const { result } = renderData();
      expect(lastPositionsQueryCall()?.[0]).toMatchObject({ fresh: false });

      act(() => markStakePositionTransacted({ ...POSITION, action: "deactivate" }));

      expect(lastPositionsQueryCall()).toEqual([
        { network: NETWORK, address: OWNER_ADDRESS, fresh: true },
        { refetchOnMountOrArgChange: 30, pollingInterval: POLL_INTERVAL_MS },
      ]);
      expect(result.current).toMatchObject({ kind: "ready", isPolling: true });
    });

    it("should stop polling, forget the transaction and drop the cached positions once the backend shows it", () => {
      markStakePositionTransacted({ ...POSITION, action: "deactivate" });
      const { result, rerenderWith } = renderData();

      rerenderWith({ data: positionsWith({ status: "deactivating" }), isError: false });

      expect(result.current).toMatchObject({
        kind: "ready",
        status: "deactivating",
        isPolling: false,
      });
      expect(refreshEarnPositions).toHaveBeenCalledWith(OWNER_ADDRESS);
      expect(lastPositionsQueryCall()?.[1]).toMatchObject({ pollingInterval: 0 });
      expect(lastPositionsQueryCall()?.[0]).toMatchObject({ fresh: false });
    });

    it("should keep polling a withdrawal while the backend snapshot that lacks the row is stale", () => {
      markStakePositionTransacted({ ...POSITION, action: "withdraw" });
      const { rerenderWith } = renderData();

      rerenderWith({
        data: { ...mockEarnPositions({ positions: [] }), isStale: true },
        isError: false,
      });

      expect(refreshEarnPositions).not.toHaveBeenCalled();
      expect(lastPositionsQueryCall()?.[0]).toMatchObject({ fresh: true });
      expect(lastPositionsQueryCall()?.[1]).toMatchObject({ pollingInterval: POLL_INTERVAL_MS });
    });

    it("should not wait on the next open once the backend has shown it", () => {
      markStakePositionTransacted({ ...POSITION, action: "withdraw" });
      positionsQuery = { data: mockEarnPositions({ positions: [] }), isError: false };
      renderData().unmount();

      renderData();

      expect(lastPositionsQueryCall()).toEqual([
        { network: NETWORK, address: OWNER_ADDRESS, fresh: false },
        { refetchOnMountOrArgChange: 30, pollingInterval: 0 },
      ]);
    });

    it("should stop polling after a minute, and wait again on the next open", () => {
      markStakePositionTransacted({ ...POSITION, action: "deactivate" });
      const { result, unmount } = renderData();

      act(() => jest.advanceTimersByTime(POLL_TIMEOUT_MS));

      expect(result.current).toMatchObject({ kind: "ready", isPolling: false });
      expect(lastPositionsQueryCall()?.[1]).toMatchObject({ pollingInterval: 0 });
      expect(lastPositionsQueryCall()?.[0]).toMatchObject({ fresh: true });

      unmount();
      renderData();
      expect(lastPositionsQueryCall()?.[1]).toMatchObject({ pollingInterval: POLL_INTERVAL_MS });
    });

    it("should wait a minute again for a second transaction recorded in the same open", () => {
      markStakePositionTransacted({ ...POSITION, action: "deactivate" });
      const { result } = renderData();
      act(() => jest.advanceTimersByTime(POLL_TIMEOUT_MS));
      expect(result.current).toMatchObject({ isPolling: false });

      act(() => markStakePositionTransacted({ ...POSITION, action: "deactivate" }));

      expect(result.current).toMatchObject({ kind: "ready", isPolling: true });
      expect(lastPositionsQueryCall()?.[1]).toMatchObject({ pollingInterval: POLL_INTERVAL_MS });
      act(() => jest.advanceTimersByTime(POLL_TIMEOUT_MS));
      expect(result.current).toMatchObject({ isPolling: false });
    });

    it("should not poll while the surface is closed", () => {
      markStakePositionTransacted({ ...POSITION, action: "deactivate" });

      renderData({ isOpen: false });

      expect(lastPositionsQueryCall()?.[1]).toMatchObject({ pollingInterval: 0 });
    });

    it("should not wait for a transaction older than the window", () => {
      markStakePositionTransacted({ ...POSITION, action: "deactivate" });
      jest.setSystemTime(NOW + TRANSACTED_WINDOW_MS + 1);

      const { result } = renderData();

      expect(lastPositionsQueryCall()?.[0]).toMatchObject({ fresh: false });
      expect(result.current).toMatchObject({ kind: "ready", isPolling: false });
    });

    it("should not wait for a transaction on another position of the address", () => {
      markStakePositionTransacted({
        ...POSITION,
        positionId: "OtherStakeAccount",
        action: "withdraw",
      });

      renderData();

      expect(lastPositionsQueryCall()?.[0]).toMatchObject({ fresh: false });
      act(() => clearStakePositionTransaction({ ...POSITION, positionId: "OtherStakeAccount" }));
    });
  });
});
