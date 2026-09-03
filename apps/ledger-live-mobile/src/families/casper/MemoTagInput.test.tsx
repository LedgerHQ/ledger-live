import React from "react";
import { render } from "@testing-library/react-native";
import BigNumber from "bignumber.js";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import type { Transaction as CasperTransaction } from "@ledgerhq/live-common/families/casper/types";

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock("LLM/features/MemoTag/components/GenericMemoTagInput", () => ({
  GenericMemoTagInput: jest.fn(() => null),
}));

import MemoTagInput from "./MemoTagInput";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";

const mockGenericMemoTagInput = jest.mocked(GenericMemoTagInput);

const baseTx: CasperTransaction = {
  family: "casper",
  amount: new BigNumber(0),
  recipient: "",
  fees: new BigNumber(0),
  useAllAmount: false,
};

const baseProps: MemoTagInputProps<CasperTransaction> = {
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

  describe("textToValue", () => {
    function getTextToValue() {
      render(<MemoTagInput {...baseProps} />);
      const props = mockGenericMemoTagInput.mock.calls[0][0] as {
        textToValue: (t: string) => string;
      };
      return props.textToValue;
    }

    it("strips non-digit characters", () => {
      expect(getTextToValue()("abc123def")).toBe("123");
    });

    it("returns empty string when input has no digits", () => {
      expect(getTextToValue()("abc")).toBe("");
    });

    it("leaves pure numeric strings unchanged", () => {
      expect(getTextToValue()("456")).toBe("456");
    });
  });

  describe("valueToTxPatch", () => {
    function getValueToTxPatch() {
      render(<MemoTagInput {...baseProps} />);
      const props = mockGenericMemoTagInput.mock.calls[0][0] as {
        valueToTxPatch: (v: string) => (tx: CasperTransaction) => CasperTransaction;
      };
      return props.valueToTxPatch;
    }

    it("sets transferId, memoType, and memoValue when value is non-empty", () => {
      const patch = getValueToTxPatch()("123")(baseTx);
      expect(patch.transferId).toBe("123");
      expect(patch.memoType).toBe("transferId");
      expect(patch.memoValue).toBe("123");
    });

    it("clears memo fields when value is empty string", () => {
      const patch = getValueToTxPatch()("")(baseTx);
      expect(patch.transferId).toBeUndefined();
      expect(patch.memoType).toBe("transferId");
      expect(patch.memoValue).toBeUndefined();
    });
  });
});
