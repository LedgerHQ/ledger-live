import { renderHook } from "@testing-library/react";
import { useRefreshEarnPositions } from "@domain/api-earn-positions";
import {
  clearStakePositionTransaction,
  getStakePositionTransaction,
  positionKeyOf,
} from "../stakePositionTransactions.internals";
import { useMarkStakePositionTransacted } from "./useMarkStakePositionTransacted";

jest.mock("@domain/api-earn-positions", () => ({ useRefreshEarnPositions: jest.fn() }));

const TRANSACTION = {
  ownerAddress: "Wa11etTestAddress1111111111111111111111111111",
  positionId: "StakeAccountA1111111111111111111111111111111",
  action: "withdraw",
} as const;

describe("useMarkStakePositionTransacted", () => {
  const refreshEarnPositions = jest.fn();

  beforeEach(() => {
    jest.mocked(useRefreshEarnPositions).mockReturnValue(refreshEarnPositions);
  });

  afterEach(() => {
    clearStakePositionTransaction(TRANSACTION);
    jest.clearAllMocks();
  });

  it("should drop the cached positions of the address after the user's transaction", () => {
    const { result } = renderHook(() => useMarkStakePositionTransacted());

    result.current(TRANSACTION);

    expect(refreshEarnPositions).toHaveBeenCalledWith(TRANSACTION.ownerAddress);
  });

  it("should record the transaction, so the next opens of the position wait for it", () => {
    const { result } = renderHook(() => useMarkStakePositionTransacted());

    result.current(TRANSACTION);

    expect(getStakePositionTransaction(positionKeyOf(TRANSACTION))).toMatchObject({
      action: "withdraw",
    });
  });

  it("should return the same function while the refresh does not change", () => {
    const { result, rerender } = renderHook(() => useMarkStakePositionTransacted());
    const markTransacted = result.current;

    rerender();

    expect(result.current).toBe(markTransacted);
  });
});
