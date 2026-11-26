import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { GenericMemoTagInput } from "../GenericMemoTagInput";

const MAX_BYTE_LENGTH = 32;
const onChange = jest.fn();

function changeMemo(text: string) {
  render(
    <GenericMemoTagInput
      onChange={onChange}
      maxByteLength={MAX_BYTE_LENGTH}
      valueToTxPatch={() => tx => tx}
    />,
  );
  fireEvent.changeText(screen.getByTestId("memo-tag-input"), text);
  return onChange.mock.lastCall[0];
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GenericMemoTagInput", () => {
  it("should keep a memo above the byte limit whole and report it as too long", () => {
    const memo = "é".repeat(17);

    const update = changeMemo(memo);

    expect(update.value).toBe(memo);
    expect(update.error).toMatchObject({ name: "MemoTooLong", memoLength: 34, maxLength: 32 });
    expect(screen.getByTestId("memo-tag-input")).toHaveDisplayValue(memo);
  });

  it("should accept a memo exactly at the byte limit", () => {
    expect(changeMemo("a".repeat(MAX_BYTE_LENGTH)).error).toBeUndefined();
  });

  it("should leave an over-limit memo out of the transaction so fee estimation never sends it", () => {
    const valueToTxPatch = jest.fn(() => (tx: never) => tx);
    render(
      <GenericMemoTagInput
        onChange={onChange}
        maxByteLength={MAX_BYTE_LENGTH}
        valueToTxPatch={valueToTxPatch}
      />,
    );

    fireEvent.changeText(screen.getByTestId("memo-tag-input"), "a".repeat(MAX_BYTE_LENGTH + 1));

    expect(valueToTxPatch).toHaveBeenLastCalledWith("");
  });

  it("should put a memo within the limit into the transaction", () => {
    const valueToTxPatch = jest.fn(() => (tx: never) => tx);
    render(
      <GenericMemoTagInput
        onChange={onChange}
        maxByteLength={MAX_BYTE_LENGTH}
        valueToTxPatch={valueToTxPatch}
      />,
    );

    fireEvent.changeText(screen.getByTestId("memo-tag-input"), "invoice-42");

    expect(valueToTxPatch).toHaveBeenLastCalledWith("invoice-42");
  });
});
