import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import BigNumber from "bignumber.js";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/canton/types";
import { DurationEnum } from "@ledgerhq/coin-canton/types";
import ExpiryDurationField from "./ExpiryDurationField";
import { createMockAccount } from "./__tests__/testUtils";
import { mockDomMeasurements } from "LLD/features/__tests__/shared";

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: () => ({
    updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({
      ...tx,
      ...patch,
    }),
  }),
}));

describe("ExpiryDurationField", () => {
  const mockOnChange = jest.fn();
  const mockAccount = createMockAccount({ xpub: "test-address" });

  const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
    family: "canton",
    amount: new BigNumber(100),
    recipient: "recipient-address",
    fee: new BigNumber(1),
    memo: "",
    tokenId: "Amulet",
    ...overrides,
  });

  const createMockTransactionStatus = (
    overrides: Partial<TransactionStatus> = {},
  ): TransactionStatus => ({
    amount: new BigNumber(100),
    totalSpent: new BigNumber(101),
    estimatedFees: new BigNumber(1),
    errors: {},
    warnings: {},
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDomMeasurements();
  });

  it("should render the label", () => {
    const transaction = createMockTransaction();
    const status = createMockTransactionStatus();

    render(
      <ExpiryDurationField
        onChange={mockOnChange}
        account={mockAccount}
        transaction={transaction}
        status={status}
      />,
    );

    expect(screen.getByText("Expiry duration")).toBeVisible();
  });

  it("should default to 1 day when no expireInSeconds is set", () => {
    const transaction = createMockTransaction({ expireInSeconds: undefined });
    const status = createMockTransactionStatus();

    render(
      <ExpiryDurationField
        onChange={mockOnChange}
        account={mockAccount}
        transaction={transaction}
        status={status}
      />,
    );

    // The Select component should show the default value (1 day)
    expect(screen.getByText("1 day")).toBeVisible();
  });

  it("should show selected value when expireInSeconds matches an option", () => {
    const threeHoursSeconds = 3 * 60 * 60;
    const transaction = createMockTransaction({ expireInSeconds: threeHoursSeconds });
    const status = createMockTransactionStatus();

    render(
      <ExpiryDurationField
        onChange={mockOnChange}
        account={mockAccount}
        transaction={transaction}
        status={status}
      />,
    );

    expect(screen.getByText("3 hours")).toBeVisible();
  });

  it("should show 1 week when expireInSeconds is set to 1 week", () => {
    const oneWeekSeconds = 7 * 24 * 60 * 60;
    const transaction = createMockTransaction({ expireInSeconds: oneWeekSeconds });
    const status = createMockTransactionStatus();

    render(
      <ExpiryDurationField
        onChange={mockOnChange}
        account={mockAccount}
        transaction={transaction}
        status={status}
      />,
    );

    expect(screen.getByText("1 week")).toBeVisible();
  });

  it("should show 1 month when expireInSeconds is set to 1 month", () => {
    const oneMonthSeconds = 30 * 24 * 60 * 60;
    const transaction = createMockTransaction({ expireInSeconds: oneMonthSeconds });
    const status = createMockTransactionStatus();

    render(
      <ExpiryDurationField
        onChange={mockOnChange}
        account={mockAccount}
        transaction={transaction}
        status={status}
      />,
    );

    expect(screen.getByText("30 days")).toBeVisible();
  });

  it("should call onChange with updated transaction when option is selected", async () => {
    const transaction = createMockTransaction({ expireInSeconds: 24 * 60 * 60 });
    const status = createMockTransactionStatus();

    const { user } = render(
      <ExpiryDurationField
        onChange={mockOnChange}
        account={mockAccount}
        transaction={transaction}
        status={status}
      />,
    );

    // Open the dropdown by clicking on the current selection
    const select = screen.getByText("1 day");
    await user.click(select);

    // Wait for dropdown to open and click on 3 hours option
    await waitFor(async () => {
      const threeHoursOption = screen.getByText("3 hours");
      await user.click(threeHoursOption);
    });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        expireInSeconds: 3 * 60 * 60,
      }),
    );
  });

  it("should map DurationEnum values correctly to seconds", () => {
    // Test each duration enum value
    const testCases = [
      { enum: DurationEnum.THREE_HOURS, seconds: 3 * 60 * 60, label: "3 hours" },
      { enum: DurationEnum.SIX_HOURS, seconds: 6 * 60 * 60, label: "6 hours" },
      { enum: DurationEnum.ONE_DAY, seconds: 24 * 60 * 60, label: "1 day" },
      { enum: DurationEnum.ONE_WEEK, seconds: 7 * 24 * 60 * 60, label: "1 week" },
      { enum: DurationEnum.ONE_MONTH, seconds: 30 * 24 * 60 * 60, label: "30 days" },
    ];

    testCases.forEach(({ seconds, label }) => {
      const transaction = createMockTransaction({ expireInSeconds: seconds });
      const status = createMockTransactionStatus();

      render(
        <ExpiryDurationField
          onChange={mockOnChange}
          account={mockAccount}
          transaction={transaction}
          status={status}
        />,
      );

      expect(screen.getByText(label)).toBeVisible();
    });
  });

  it("should default to 1 day when expireInSeconds does not match any option", () => {
    // Use a value that doesn't match any predefined option
    const transaction = createMockTransaction({ expireInSeconds: 12345 });
    const status = createMockTransactionStatus();

    render(
      <ExpiryDurationField
        onChange={mockOnChange}
        account={mockAccount}
        transaction={transaction}
        status={status}
      />,
    );

    // Should fallback to 1 day (index 2 in options array)
    expect(screen.getByText("1 day")).toBeVisible();
  });
});
