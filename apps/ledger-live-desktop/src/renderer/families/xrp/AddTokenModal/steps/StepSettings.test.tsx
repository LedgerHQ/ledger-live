import React from "react";
import { BigNumber } from "bignumber.js";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import { XrpTrustLimitZero } from "@ledgerhq/live-common/families/xrp/types";
import { fireEvent, render, screen } from "tests/testSetup";
import type { StepProps } from "../types";
import StepSettings, { StepSettingsFooter } from "./StepSettings";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (transaction: object, patch: object) => ({ ...transaction, ...patch }),
  }),
}));

const token = {
  id: "ripple_testnet/iou/rlusd",
  name: "RLUSD",
  ticker: "tRLUSD",
  tokenType: "iou",
  units: [{ name: "RLUSD", code: "tRLUSD", magnitude: 0 }],
} as TokenCurrency;

const noStatus = { errors: {}, warnings: {} } as TransactionStatus;

function renderStepSettings(overrides: Partial<StepProps> = {}) {
  const onUpdateTransaction = jest.fn();
  const onChangeRippling = jest.fn();
  const transitionTo = jest.fn();
  const props = {
    token,
    onUpdateTransaction,
    onChangeRippling,
    transitionTo,
    account: { id: "xrp" } as Account,
    parentAccount: undefined,
    transaction: { amount: new BigNumber(1000) } as Transaction,
    status: noStatus,
    tokenAccount: undefined,
    maxLimit: new BigNumber(5000),
    isRippling: false,
    onClose: jest.fn(),
    bridgePending: false,
    ...overrides,
  } as unknown as StepProps;

  render(
    <>
      <StepSettings {...props} />
      <StepSettingsFooter {...props} />
    </>,
  );

  const getUpdatedAmount = () => {
    const updater = onUpdateTransaction.mock.lastCall?.[0];
    return updater?.({ amount: new BigNumber(0) }).amount.toFixed();
  };

  return { getUpdatedAmount, transitionTo, onChangeRippling };
}

describe("StepSettings", () => {
  it("shows the limit the transaction holds", () => {
    renderStepSettings();

    expect(screen.getByRole("textbox")).toHaveValue("1,000");
  });

  it("puts Max back in the transaction", () => {
    const { getUpdatedAmount } = renderStepSettings();

    fireEvent.click(screen.getByText("Max"));

    expect(getUpdatedAmount()).toBe("5000");
  });

  it("sends a typed limit to the transaction", () => {
    const { getUpdatedAmount } = renderStepSettings();

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "250" } });

    expect(getUpdatedAmount()).toBe("250");
  });

  it("refuses a limit of 0 and points to Remove", () => {
    const { transitionTo } = renderStepSettings({
      transaction: { amount: new BigNumber(0) } as Transaction,
      status: {
        errors: { amount: new XrpTrustLimitZero() },
        warnings: {},
      } as unknown as TransactionStatus,
    });

    expect(screen.getByText(/use Remove token instead/)).toBeVisible();
    fireEvent.click(screen.getByText("Continue"));
    expect(transitionTo).not.toHaveBeenCalled();
  });

  it("accepts a limit below the balance with no warning, and continues to the review", () => {
    const { transitionTo } = renderStepSettings({
      tokenAccount: { balance: new BigNumber(2000) } as TokenAccount,
    });

    expect(screen.queryByText(/balance/i)).toBeNull();
    fireEvent.click(screen.getByText("Continue"));
    expect(transitionTo).toHaveBeenCalledWith("review");
  });

  it("keeps rippling off by default, with no warning", () => {
    renderStepSettings();

    expect(screen.getByRole("checkbox", { hidden: true })).not.toBeChecked();
    expect(screen.queryByText(/Only turn it on/)).toBeNull();
  });

  it("turns rippling on", () => {
    const { onChangeRippling } = renderStepSettings();

    fireEvent.click(screen.getByTestId("xrp-rippling-switch"));

    expect(onChangeRippling).toHaveBeenCalledWith(true);
  });

  it("warns when rippling is on", () => {
    renderStepSettings({ isRippling: true });

    expect(screen.getByText(/Only turn it on if you know what you're doing/)).toBeVisible();
  });
});
