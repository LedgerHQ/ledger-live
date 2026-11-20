import React from "react";
import BigNumber from "bignumber.js";
import { fireEvent, screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import type { Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import CosmosFamilySendRowsCustomComponent from "../shared/CosmosFamilySendRowsCustomComponent";

const makeTransaction = (patch: Partial<Transaction> = {}) =>
  ({
    family: "cosmos",
    mode: "send",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    ...patch,
  }) as Transaction;

describe("CosmosFamilySendRowsCustomComponent", () => {
  it("shows the memoValue of the transaction", () => {
    render(
      <CosmosFamilySendRowsCustomComponent
        transaction={makeTransaction({ memoType: "text", memoValue: "invoice 42" })}
        editMemo={jest.fn()}
      />,
    );

    expect(screen.getByTestId("summary-memo-tag")).toHaveTextContent("invoice 42");
  });

  it("offers to add a memo when memoValue is empty", () => {
    render(
      <CosmosFamilySendRowsCustomComponent
        transaction={makeTransaction({ memoType: null, memoValue: null })}
        editMemo={jest.fn()}
      />,
    );

    expect(screen.queryByTestId("summary-memo-tag")).toBeNull();
    expect(screen.getByText("Edit")).toBeOnTheScreen();
  });

  it("calls editMemo when the memo is pressed", () => {
    const editMemo = jest.fn();
    render(
      <CosmosFamilySendRowsCustomComponent
        transaction={makeTransaction({ memoType: "text", memoValue: "invoice 42" })}
        editMemo={editMemo}
      />,
    );

    fireEvent.press(screen.getByTestId("summary-memo-tag"));

    expect(editMemo).toHaveBeenCalledTimes(1);
  });

  it("calls editMemo when the edit link is pressed", () => {
    const editMemo = jest.fn();
    render(
      <CosmosFamilySendRowsCustomComponent
        transaction={makeTransaction({ memoType: null, memoValue: null })}
        editMemo={editMemo}
      />,
    );

    fireEvent.press(screen.getByText("Edit"));

    expect(editMemo).toHaveBeenCalledTimes(1);
  });
});
