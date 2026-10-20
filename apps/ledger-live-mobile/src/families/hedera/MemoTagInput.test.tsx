import React from "react";
import BigNumber from "bignumber.js";
import type { HederaGenericTransaction } from "@ledgerhq/live-common/families/hedera/types";
import { fireEvent, render, screen } from "@tests/test-renderer";
import MemoTagInput from "./MemoTagInput";

const onChange = jest.fn();

const baseTx: HederaGenericTransaction = {
  family: "hedera",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
};

function typeMemo(text: string) {
  render(<MemoTagInput onChange={onChange} />);
  fireEvent.changeText(screen.getByTestId("memo-tag-input"), text);
  return onChange.mock.lastCall[0].patch(baseTx);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("MemoTagInput", () => {
  it("should write the generic memo fields when a memo is typed", () => {
    expect(typeMemo("ref-42")).toMatchObject({ memoType: "string", memoValue: "ref-42" });
  });

  it("should clear the memo value when the input is empty", () => {
    expect(typeMemo("")).toHaveProperty("memoValue", undefined);
  });
});
