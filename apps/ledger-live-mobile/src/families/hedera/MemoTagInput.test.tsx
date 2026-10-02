import React from "react";
import { render } from "@testing-library/react-native";
import BigNumber from "bignumber.js";
import type { HederaGenericTransaction } from "@ledgerhq/live-common/families/hedera/types";

jest.mock("LLM/features/MemoTag/components/GenericMemoTagInput", () => ({
  GenericMemoTagInput: jest.fn(() => null),
}));

import MemoTagInput from "./MemoTagInput";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

const mockGenericMemoTagInput = jest.mocked(GenericMemoTagInput);

const baseTx: HederaGenericTransaction = {
  family: "hedera",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
};

function getValueToTxPatch() {
  render(<MemoTagInput onChange={jest.fn()} />);
  const props = mockGenericMemoTagInput.mock.calls[0][0] as {
    valueToTxPatch: (v: string) => (tx: HederaGenericTransaction) => HederaGenericTransaction;
  };
  return props.valueToTxPatch;
}

beforeEach(() => {
  mockGenericMemoTagInput.mockClear();
});

describe("MemoTagInput", () => {
  it("writes the generic memo fields", () => {
    expect(getValueToTxPatch()("ref-42")(baseTx)).toMatchObject({
      memoType: "string",
      memoValue: "ref-42",
    });
    expect(mockGenericMemoTagInput).toHaveBeenCalledTimes(1);
  });

  it("clears the memo value when the input is empty", () => {
    expect(getValueToTxPatch()("")(baseTx).memoValue).toBeUndefined();
    expect(mockGenericMemoTagInput).toHaveBeenCalledTimes(1);
  });
});
