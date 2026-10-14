import React from "react";
import { render } from "@testing-library/react-native";
import BigNumber from "bignumber.js";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import type { Transaction as CosmosTransaction } from "@ledgerhq/live-common/families/cosmos/types";

jest.mock("LLM/features/MemoTag/components/GenericMemoTagInput", () => ({
  GenericMemoTagInput: jest.fn(() => null),
}));

import MemoTagInput from "./MemoTagInput";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

const mockGenericMemoTagInput = jest.mocked(GenericMemoTagInput);

const baseTx: CosmosTransaction = {
  family: "cosmos",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
} as CosmosTransaction;

const baseProps: MemoTagInputProps<CosmosTransaction> = {
  onChange: jest.fn(),
};

beforeEach(() => {
  mockGenericMemoTagInput.mockClear();
});

describe("MemoTagInput", () => {
  it("renders GenericMemoTagInput", () => {
    render(<MemoTagInput {...baseProps} />);
    expect(mockGenericMemoTagInput).toHaveBeenCalledTimes(1);
  });

  describe("valueToTxPatch", () => {
    function getValueToTxPatch() {
      render(<MemoTagInput {...baseProps} />);
      const props = mockGenericMemoTagInput.mock.calls[0][0] as {
        valueToTxPatch: (v: string) => (tx: CosmosTransaction) => CosmosTransaction;
      };
      return props.valueToTxPatch;
    }

    it("sets memo, memoType, and memoValue when value is non-empty", () => {
      const patch = getValueToTxPatch()("test memo")(baseTx);
      expect(patch.memo).toBe("test memo");
      expect(patch.memoType).toBe("text");
      expect(patch.memoValue).toBe("test memo");
    });

    it("clears memo fields when value is empty string", () => {
      const patch = getValueToTxPatch()("")(baseTx);
      expect(patch.memo).toBeUndefined();
      expect(patch.memoType).toBeNull();
      expect(patch.memoValue).toBeUndefined();
    });
  });
});
