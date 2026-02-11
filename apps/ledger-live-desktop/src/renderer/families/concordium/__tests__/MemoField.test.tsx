import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BigNumber from "bignumber.js";
import MemoField from "../MemoField";
import { createMockAccount, createMockConcordiumCurrency } from "./testUtils";

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(() => ({
    updateTransaction: jest.fn((tx, patch) => ({ ...tx, ...patch })),
  })),
}));

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
}));

jest.mock("LLD/features/MemoTag/components/MemoTagField", () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
    maxLength,
    error,
    autoFocus,
  }: {
    value: string;
    onChange: (v: string) => void;
    maxLength: number;
    error?: Error;
    autoFocus?: boolean;
  }) => (
    <div data-testid="memo-tag-field">
      <input
        data-testid="memo-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={maxLength}
        autoFocus={autoFocus}
      />
      {error && <span data-testid="memo-error">{error.message}</span>}
    </div>
  ),
}));

describe("MemoField", () => {
  const mockCurrency = createMockConcordiumCurrency();
  const mockAccount = createMockAccount({ currency: mockCurrency });
  const mockTransaction = {
    family: "concordium" as const,
    memo: "",
    amount: new BigNumber(0),
    recipient: "",
    fee: null,
  };
  const mockStatus = {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  };

  const defaultProps = {
    account: mockAccount,
    transaction: mockTransaction,
    onChange: jest.fn(),
    status: mockStatus,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render memo field", () => {
    render(<MemoField {...defaultProps} />);
    expect(screen.getByTestId("memo-tag-field")).toBeInTheDocument();
  });

  it("should display current memo value", () => {
    const propsWithMemo = {
      ...defaultProps,
      transaction: { ...mockTransaction, memo: "test memo" },
    };
    render(<MemoField {...propsWithMemo} />);
    expect(screen.getByTestId("memo-input")).toHaveValue("test memo");
  });

  it("should call onChange with updated transaction when memo changes", () => {
    const onChange = jest.fn();
    render(<MemoField {...defaultProps} onChange={onChange} />);

    const input = screen.getByTestId("memo-input");
    fireEvent.change(input, { target: { value: "new memo" } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ memo: "new memo" }));
  });

  it("should track memo input event", () => {
    const { track } = jest.requireMock("~/renderer/analytics/segment");
    const trackProperties = { flow: "send" };

    render(<MemoField {...defaultProps} trackProperties={trackProperties} />);

    const input = screen.getByTestId("memo-input");
    fireEvent.change(input, { target: { value: "tracked memo" } });

    expect(track).toHaveBeenCalledWith("button_clicked2", {
      flow: "send",
      button: "input",
      memo: "tracked memo",
    });
  });

  it("should display error when status has memo error", () => {
    const propsWithError = {
      ...defaultProps,
      status: { ...mockStatus, errors: { memo: new Error("Memo too long") } },
    };
    render(<MemoField {...propsWithError} />);
    expect(screen.getByTestId("memo-error")).toHaveTextContent("Memo too long");
  });

  it("should handle undefined memo in transaction", () => {
    const propsWithUndefinedMemo = {
      ...defaultProps,
      transaction: { ...mockTransaction, memo: undefined },
    };
    render(<MemoField {...propsWithUndefinedMemo} />);
    expect(screen.getByTestId("memo-input")).toHaveValue("");
  });
});
