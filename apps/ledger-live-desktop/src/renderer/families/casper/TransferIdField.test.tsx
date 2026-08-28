/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "tests/testSetup";
import BigNumber from "bignumber.js";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/casper/types";
import TransferIdField from "./TransferIdField";

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

describe("TransferIdField (casper)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders an input element", () => {
    render(
      <TransferIdField
        onChange={mockOnChange}
        account={mockAccount}
        transaction={baseTransaction}
        status={baseStatus}
      />,
    );
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("strips non-digits and calls onChange with transferId set", () => {
    render(
      <TransferIdField
        onChange={mockOnChange}
        account={mockAccount}
        transaction={baseTransaction}
        status={baseStatus}
      />,
    );

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "abc456" } });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const updated = mockOnChange.mock.calls[0][0];
    expect(updated.transferId).toBe("456");
    expect(updated.memoType).toBe("transferId");
    expect(updated.memoValue).toBe("456");
  });

  it("clears transferId when only non-digit characters are entered", () => {
    render(
      <TransferIdField
        onChange={mockOnChange}
        account={mockAccount}
        transaction={baseTransaction}
        status={baseStatus}
      />,
    );

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "xyz" } });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const updated = mockOnChange.mock.calls[0][0];
    expect(updated.transferId).toBeUndefined();
    expect(updated.memoType).toBeNull();
    expect(updated.memoValue).toBeNull();
  });

  it("shows the existing memoValue as the current input value", () => {
    render(
      <TransferIdField
        onChange={mockOnChange}
        account={mockAccount}
        transaction={{ ...baseTransaction, memoValue: "5555" }}
        status={baseStatus}
      />,
    );
    expect(screen.getByRole("textbox")).toHaveValue("5555");
  });
});
