import type { Transaction } from "@ledgerhq/live-common/families/internet_computer/types";
import BigNumber from "bignumber.js";
import React from "react";
import { fireEvent, render, screen } from "tests/testSetup";
import { makeICPAccount } from "./testUtils";

const bridgeMock = {
  updateTransaction: jest.fn((transaction, patch) => ({ ...transaction, ...patch })),
};

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  __esModule: true,
  useAccountBridge: () => bridgeMock,
}));

import MemoField from "../MemoField";

const makeTransaction = (type: Transaction["type"], memo?: string): Transaction =>
  ({
    family: "internet_computer",
    type,
    amount: new BigNumber(0),
    recipient: "",
    fees: new BigNumber(0),
    ...(memo !== undefined && { memo }),
  }) as Transaction;

const status = { errors: {}, warnings: {} } as never;

const renderField = (type: Transaction["type"], memo?: string, onChange = jest.fn()) => {
  render(
    <MemoField
      account={makeICPAccount()}
      transaction={makeTransaction(type, memo)}
      status={status}
      onChange={onChange}
    />,
  );
  return onChange;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("MemoField (internet_computer)", () => {
  it("renders an editable memo input for a plain send", () => {
    renderField("send");

    expect(screen.getByTestId("memo-tag-input")).toBeInTheDocument();
    expect(screen.queryByTestId("warning-box")).not.toBeInTheDocument();
  });

  it("updates the transaction memo as the user types", () => {
    const onChange = renderField("send");

    fireEvent.change(screen.getByTestId("memo-tag-input"), { target: { value: "42" } });

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(expect.anything(), { memo: "42" });
    expect(onChange).toHaveBeenCalled();
  });

  it("clears the memo when the field is emptied", () => {
    // Needs a starting value: React fires no change event when the value is already "".
    renderField("send", "42");

    fireEvent.change(screen.getByTestId("memo-tag-input"), { target: { value: "" } });

    expect(bridgeMock.updateTransaction).toHaveBeenCalledWith(expect.anything(), {
      memo: undefined,
    });
  });

  // The nonce that identifies the neuron is derived by prepareTransaction, so these two types must
  // explain the memo rather than let the user edit it.
  it.each([
    ["create_neuron", "This transaction will create a neuron with staked ICP"],
    ["increase_stake", "This transaction will increase the stake of an existing neuron"],
  ])("replaces the input with an explanation for %s", (type, copy) => {
    renderField(type as Transaction["type"]);

    expect(screen.queryByTestId("memo-tag-input")).not.toBeInTheDocument();
    expect(screen.getByTestId("warning-box")).toHaveTextContent(copy);
  });
});
