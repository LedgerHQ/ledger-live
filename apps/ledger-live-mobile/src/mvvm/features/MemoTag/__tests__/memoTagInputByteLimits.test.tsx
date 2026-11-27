import React from "react";
import { MAX_MEMO_LENGTH as CONCORDIUM_MAX_MEMO_LENGTH } from "@ledgerhq/coin-concordium/constants";
import { ALGORAND_MAX_MEMO_SIZE } from "@ledgerhq/live-common/families/algorand/logic";
import { CARDANO_MAX_MEMO_TAG_SIZE } from "@ledgerhq/live-common/families/cardano/logic";
import { MAX_MEMO_LENGTH as SOLANA_MAX_MEMO_LENGTH } from "@ledgerhq/live-common/families/solana/logic";
import { STACKS_MAX_MEMO_SIZE } from "@ledgerhq/live-common/families/stacks/constants";
import { fireEvent, render, screen } from "@tests/test-renderer";
import perFamily from "~/generated/MemoTagInput";

const onChange = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("byte-limited memo tag inputs", () => {
  it.each([
    ["algorand", ALGORAND_MAX_MEMO_SIZE],
    ["cardano", CARDANO_MAX_MEMO_TAG_SIZE],
    ["concordium", CONCORDIUM_MAX_MEMO_LENGTH],
    ["solana", SOLANA_MAX_MEMO_LENGTH],
    ["stacks", STACKS_MAX_MEMO_SIZE],
  ] as const)(
    "should keep an over-limit %s memo whole and report it as too long (max %d bytes)",
    (family, maxByteLength) => {
      const MemoTagInput = perFamily[family];
      const memo = "é".repeat(Math.ceil((maxByteLength + 1) / 2));
      render(<MemoTagInput onChange={onChange} />);

      fireEvent.changeText(screen.getByTestId("memo-tag-input"), memo);

      expect(onChange.mock.lastCall[0]).toMatchObject({
        value: memo,
        error: {
          name: "MemoTooLong",
          memoLength: Buffer.byteLength(memo),
          maxLength: maxByteLength,
        },
      });
    },
  );

  it.each(["algorand", "cardano", "concordium", "solana", "stacks"] as const)(
    "should not cap the %s memo input natively, so a long paste reaches validation",
    family => {
      const MemoTagInput = perFamily[family];
      render(<MemoTagInput onChange={onChange} />);

      expect(screen.getByTestId("memo-tag-input")).not.toHaveProp("maxLength");
    },
  );
});
