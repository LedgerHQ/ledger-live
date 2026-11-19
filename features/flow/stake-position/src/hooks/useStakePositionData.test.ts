import { act, renderHook } from "@testing-library/react";
import type { z } from "zod";
import {
  useGetEarnPositionsQuery,
  useGetSolanaValidatorApyQuery,
  useRefreshEarnPositions,
  type SolanaValidatorApyByVoteAccount,
} from "@domain/api-earn-positions";
import {
  ApyFractionSchema,
  type EarnPositionSchema,
  type EarnPositions,
} from "@domain/entity-earn-position";
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
  TRANSACTED_WINDOW_MS,
  clearStakePositionTransaction,
} from "../stakePositionTransactions.internals";
import type { StakePositionOrigin } from "../types";
import { useStakePositionData, type UseStakePositionDataInput } from "./useStakePositionData";

jest.mock("@domain/api-earn-positions", () => ({
  useGetEarnPositionsQuery: jest.fn(),
  useGetSolanaValidatorApyQuery: jest.fn(),
  useRefreshEarnPositions: jest.fn(),
  selectSolanaValidatorApy: (lookup: Record<string, number> | undefined, voteAccount: string) =>
    voteAccount ? lookup?.[voteAccount] : undefined,
}));

const NETWORK = "solana";
const OWNER_ADDRESS = "Wa11etTestAddress1111111111111111111111111111";
const POSITION_ID = "StakeAccountA1111111111111111111111111111111";
const VALIDATOR = "26pV97Ce83ZQ6Kz9XT4td8tdoUFPTng8Fb8gPyc53dJx";
const VALIDATOR_APY = ApyFractionSchema.parse(0.078107);
const NEXT_VALIDATOR_APY = ApyFractionSchema.parse(0.06);
const POSITION = { ownerAddress: OWNER_ADDRESS, positionId: POSITION_ID };

type PositionsQueryState = { data?: EarnPositions; isError: boolean };
type ApyQueryState = { data?: SolanaValidatorApyByVoteAccount };
type ApyQueryOptions = {
  skip?: boolean;
  selectFromResult: (result: ApyQueryState) => unknown;
};

const refetch = jest.fn();
const refreshEarnPositions = jest.fn();
let positionsQuery: PositionsQueryState;
let apyQuery: ApyQueryState;

const mockPositionsQuery = jest.mocked(useGetEarnPositionsQuery);
const mockApyQuery = jest.mocked(useGetSolanaValidatorApyQuery);

const positionsWith = (overrides?: Partial<z.input<typeof EarnPositionSchema>>) =>
  mockEarnPositions({
    positions: [mockEarnPosition({ id: POSITION_ID, validatorAddress: VALIDATOR, ...overrides })],
  });

const lastPositionsQueryCall = () => mockPositionsQuery.mock.lastCall;
const lastApyQueryOptions = () => mockApyQuery.mock.lastCall?.[1] as ApyQueryOptions | undefined;

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
  const input: UseStakePositionDataInput = {
    request: { id: -1, origin: "account", positionId: POSITION_ID },
    isOpen: true,
    network: NETWORK,
    ownerAddress: OWNER_ADDRESS,
    ...overrides,
  };
  return renderHook((props: UseStakePositionDataInput) => useStakePositionData(props), {
    initialProps: input,
  });
}

const flushPromises = () => act(() => new Promise<void>(resolve => setTimeout(resolve, 0)));

describe("useStakePositionData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    positionsQuery = { data: positionsWith(), isError: false };
    apyQuery = { data: { [VALIDATOR]: VALIDATOR_APY } };
    mockPositionsQuery.mockImplementation((() => ({
      ...positionsQuery,
      refetch,
    })) as unknown as typeof useGetEarnPositionsQuery);
    mockApyQuery.mockImplementation(((_arg: unknown, options: ApyQueryOptions) =>
      options.selectFromResult({
        data: options.skip ? undefined : apyQuery.data,
      })) as unknown as typeof useGetSolanaValidatorApyQuery);
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
    positionsQuery = { data: undefined, isError: false };

    const { result } = renderData();

    expect(result.current).toEqual({ kind: "loading" });
  });

  it("should show the position with the APY of its validator", () => {
    const { result } = renderData();

    expect(result.current).toMatchObject({
      kind: "ready",
      status: "active",
      validatorApy: VALIDATOR_APY,
      isStale: false,
      isPolling: false,
    });
    expect(lastApyQueryOptions()?.skip).toBe(false);
  });

  describe("the validator APY never holds the position back", () => {
    it("should show the position while the APY loads", () => {
      apyQuery = { data: undefined };

      const { result } = renderData();

      expect(result.current).toMatchObject({ kind: "ready", validatorApy: undefined });
    });

    it("should show the position when the APY fails", () => {
      apyQuery = { data: undefined };
      mockApyQuery.mockImplementation(((_arg: unknown, options: ApyQueryOptions) =>
        options.selectFromResult({
          data: undefined,
        })) as unknown as typeof useGetSolanaValidatorApyQuery);

      const { result } = renderData();

      expect(result.current).toMatchObject({ kind: "ready", validatorApy: undefined });
    });

    it("should show the position without an APY when the validator is not listed", () => {
      apyQuery = { data: { OtherValidatorVoteAccount: NEXT_VALIDATOR_APY } };

      const { result } = renderData();

      expect(result.current).toMatchObject({ kind: "ready", validatorApy: undefined });
    });

    it("should not read the APY of a position without a validator", () => {
      positionsQuery = { data: positionsWith({ validatorAddress: "" }), isError: false };

      const { result } = renderData();

      expect(lastApyQueryOptions()?.skip).toBe(true);
      expect(result.current).toMatchObject({ kind: "ready", validatorApy: undefined });
    });

    it("should look the APY up by the validator the current row names", () => {
      const { result, rerender } = renderData();
      positionsQuery = {
        data: positionsWith({ validatorAddress: "NextValidatorVoteAccount" }),
        isError: false,
      };
      apyQuery = { data: { NextValidatorVoteAccount: NEXT_VALIDATOR_APY } };

      rerender({
        request: { id: -1, origin: "account", positionId: POSITION_ID },
        isOpen: true,
        network: NETWORK,
        ownerAddress: OWNER_ADDRESS,
      });

      expect(result.current).toMatchObject({ kind: "ready", validatorApy: NEXT_VALIDATOR_APY });
    });
  });

  describe("on a wallet screen", () => {
    it("should fail with a retry that reads the positions again", () => {
      positionsQuery = { data: undefined, isError: true };
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
  });

  describe("for the Earn live app", () => {
    it.each([
      ["fails to load", { data: undefined, isError: true }],
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

    it("should stop polling, forget the transaction and drop the cached positions once the backend shows it", () => {
      markStakePositionTransacted({ ...POSITION, action: "deactivate" });
      const { result, rerender } = renderData();
      positionsQuery = { data: positionsWith({ status: "deactivating" }), isError: false };

      rerender({
        request: { id: -1, origin: "account", positionId: POSITION_ID },
        isOpen: true,
        network: NETWORK,
        ownerAddress: OWNER_ADDRESS,
      });

      expect(result.current).toMatchObject({
        kind: "ready",
        status: "deactivating",
        isPolling: false,
      });
      expect(refreshEarnPositions).toHaveBeenCalledWith(OWNER_ADDRESS);
      expect(lastPositionsQueryCall()?.[1]).toMatchObject({ pollingInterval: 0 });
      expect(lastPositionsQueryCall()?.[0]).toMatchObject({ fresh: true });
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
      jest.useFakeTimers();
      markStakePositionTransacted({ ...POSITION, action: "deactivate" });
      const { result, unmount } = renderData();

      act(() => jest.advanceTimersByTime(POLL_TIMEOUT_MS));

      expect(result.current).toMatchObject({ kind: "ready", isPolling: false });
      expect(lastPositionsQueryCall()?.[1]).toMatchObject({ pollingInterval: 0 });

      unmount();
      renderData();
      expect(lastPositionsQueryCall()?.[1]).toMatchObject({ pollingInterval: POLL_INTERVAL_MS });
    });

    it("should not poll while the surface is closed", () => {
      markStakePositionTransacted({ ...POSITION, action: "deactivate" });

      renderData({ isOpen: false });

      expect(lastPositionsQueryCall()?.[1]).toMatchObject({ pollingInterval: 0 });
    });

    it("should not wait for a transaction older than the window", () => {
      jest.useFakeTimers({ now: 1_000_000 });
      markStakePositionTransacted({ ...POSITION, action: "deactivate" });
      jest.setSystemTime(1_000_000 + TRANSACTED_WINDOW_MS + 1);

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
