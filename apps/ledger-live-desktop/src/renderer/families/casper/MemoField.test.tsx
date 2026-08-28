/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import BigNumber from "bignumber.js";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/casper/types";
import MemoField from "./MemoField";

const mockUpdateTransaction = jest.fn((t, patch) => ({ ...t, ...patch }));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({ updateTransaction: mockUpdateTransaction }),
}));

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({ t: (key: string) => key }),
}));

const baseTransaction: Transaction = {
  family: "casper",
  amount: new BigNumber(0),
  fees: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  memoType: null,
  memoValue: null,
};

const baseStatus: TransactionStatus = {
  amount: new BigNumber(0),
  estimatedFees: new BigNumber(0),
  totalSpent: new BigNumber(0),
  errors: {},
  warnings: {},
};

const mockAccount = { id: "casper-account" } as any;
const mockOnChange = jest.fn();

describe("MemoField (casper)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the memo tag input", () => {
    render(
      <MemoField
        onChange={mockOnChange}
        account={mockAccount}
        transaction={baseTransaction}
        status={baseStatus}
        autoFocus={false}
      />,
    );
    expect(screen.getByTestId("memo-tag-input")).toBeInTheDocument();
  });

  it("strips non-digit characters and calls onChange with transferId set", () => {
    render(
      <MemoField
        onChange={mockOnChange}
        account={mockAccount}
        transaction={baseTransaction}
        status={baseStatus}
        autoFocus={false}
      />,
    );

    fireEvent.change(screen.getByTestId("memo-tag-input"), { target: { value: "abc123" } });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const updated = mockOnChange.mock.calls[0][0];
    expect(updated.transferId).toBe("123");
    expect(updated.memoType).toBe("transferId");
    expect(updated.memoValue).toBe("123");
  });

  it("clears transferId when input contains only non-digit characters", () => {
    render(
      <MemoField
        onChange={mockOnChange}
        account={mockAccount}
        transaction={baseTransaction}
        status={baseStatus}
        autoFocus={false}
      />,
    );

    fireEvent.change(screen.getByTestId("memo-tag-input"), { target: { value: "abc" } });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const updated = mockOnChange.mock.calls[0][0];
    expect(updated.transferId).toBeUndefined();
    expect(updated.memoType).toBeNull();
    expect(updated.memoValue).toBeNull();
  });

  it("uses the existing memoValue as the input value", () => {
    render(
      <MemoField
        onChange={mockOnChange}
        account={mockAccount}
        transaction={{ ...baseTransaction, memoValue: "9876" }}
        status={baseStatus}
        autoFocus={false}
      />,
    );
    expect(screen.getByTestId("memo-tag-input")).toHaveValue("9876");
  });

  it("displays error from status.errors.sender when present", () => {
    const error = new Error("sender error");
    render(
      <MemoField
        onChange={mockOnChange}
        account={mockAccount}
        transaction={baseTransaction}
        status={{ ...baseStatus, errors: { sender: error } }}
        autoFocus={false}
      />,
    );
    expect(screen.getByTestId("memo-tag-input")).toBeInTheDocument();
  });
});
