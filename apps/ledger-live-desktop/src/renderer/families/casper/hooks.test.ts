import { renderHook, act } from "@testing-library/react";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/families/casper/types";
import { useTransferIdChange } from "./hooks";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
  }),
}));

const account = { id: "casper:0:test", type: "Account" } as unknown as Account;

const baseTx: Transaction = {
  family: "casper",
  amount: new BigNumber(0),
  recipient: "",
  fees: new BigNumber(0),
  useAllAmount: false,
};

describe("useTransferIdChange", () => {
  beforeEach(() => jest.clearAllMocks());

  it("strips non-digit characters and sets transferId/memoType/memoValue", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTransferIdChange(account, baseTx, onChange));

    act(() => result.current("abc123def"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      ...baseTx,
      transferId: "123",
      memoType: "transferId",
      memoValue: "123",
    });
  });

  it("passes pure numeric value unchanged", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTransferIdChange(account, baseTx, onChange));

    act(() => result.current("42"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      ...baseTx,
      transferId: "42",
      memoType: "transferId",
      memoValue: "42",
    });
  });

  it("clears all memo fields when value is empty string", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTransferIdChange(account, baseTx, onChange));

    act(() => result.current(""));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      ...baseTx,
      transferId: undefined,
      memoType: null,
      memoValue: null,
    });
  });

  it("clears all memo fields when value contains only non-digit characters", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useTransferIdChange(account, baseTx, onChange));

    act(() => result.current("abc"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      ...baseTx,
      transferId: undefined,
      memoType: null,
      memoValue: null,
    });
  });
});
