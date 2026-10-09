import React from "react";
import BigNumber from "bignumber.js";
import type { AlgorandGenericTransaction } from "@ledgerhq/live-common/families/algorand/types";
import { fireEvent, render, screen } from "@tests/test-renderer";
import MemoTagInput from "./MemoTagInput";

const onChange = jest.fn();

const baseTx: AlgorandGenericTransaction = {
  family: "algorand",
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
  it("should write the generic note fields when a note is typed", () => {
    expect(typeMemo("ref-42")).toMatchObject({ memoType: "note", memoValue: "ref-42" });
  });

  it("should leave both note fields unset when the input is empty", () => {
    expect(typeMemo("")).toMatchObject({ memoType: undefined, memoValue: undefined });
  });
});
