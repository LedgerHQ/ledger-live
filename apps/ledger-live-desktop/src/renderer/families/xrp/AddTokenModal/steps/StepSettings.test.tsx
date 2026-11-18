import React from "react";
import BigNumber from "bignumber.js";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import { XrpTrustLimitZero } from "@ledgerhq/live-common/families/xrp/types";
import { fireEvent, render, screen } from "tests/testSetup";
import type { StepProps } from "../types";
import StepSettings, { StepSettingsFooter } from "./StepSettings";
import { makeStepProps } from "../../__mocks__/stepProps.mock";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (transaction: object, patch: object) => ({ ...transaction, ...patch }),
  }),
}));

function renderStepSettings(overrides: Partial<StepProps> = {}) {
  const onUpdateTransaction = jest.fn();
  const onChangeRippling = jest.fn();
  const transitionTo = jest.fn();
  const props = makeStepProps({
    onUpdateTransaction,
    onChangeRippling,
    transitionTo,
    transaction: { amount: new BigNumber(1000) } as Transaction,
    maxLimit: new BigNumber(5000),
    ...overrides,
  });

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

function makeHeldTokenAccount(limit: number) {
  return {
    type: "TokenAccount",
    balance: new BigNumber(0),
    xrpResources: {
      isLocked: false,
      isRippling: false,
      limit: new BigNumber(limit),
    },
  } as unknown as TokenAccount;
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

  it("refuses a limit of 0", () => {
    const { transitionTo } = renderStepSettings({
      transaction: { amount: new BigNumber(0) } as Transaction,
      status: {
        errors: { amount: new XrpTrustLimitZero() },
        warnings: {},
      } as unknown as TransactionStatus,
    });

    expect(screen.getByText("The limit must be above 0")).toBeVisible();
    fireEvent.click(screen.getByText("Continue"));
    expect(transitionTo).not.toHaveBeenCalled();
  });

  it("warns when the limit is below the balance, and still continues to the review", () => {
    const { transitionTo } = renderStepSettings({
      tokenAccount: { balance: new BigNumber(2000) } as TokenAccount,
    });

    expect(screen.getByText(/Your balance .* is above this limit/)).toBeVisible();
    fireEvent.click(screen.getByText("Continue"));
    expect(transitionTo).toHaveBeenCalledWith("review");
  });

  it("shows no balance warning when the limit is at or above the balance", () => {
    renderStepSettings({
      tokenAccount: { balance: new BigNumber(1000) } as TokenAccount,
    });

    expect(screen.queryByText(/Your balance .* is above this limit/)).toBeNull();
  });

  it("shows a transaction preparation error", () => {
    renderStepSettings({ error: new Error("prepare failed") });

    expect(screen.getByText(/prepare failed/)).toBeVisible();
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

describe("StepSettings, editing a held token", () => {
  it("says a current limit of 0 lets no token in, instead of the limit error", () => {
    const { transitionTo } = renderStepSettings({
      tokenAccount: makeHeldTokenAccount(0),
      transaction: { amount: new BigNumber(0) } as Transaction,
      status: {
        errors: { amount: new XrpTrustLimitZero() },
        warnings: {},
      } as unknown as TransactionStatus,
    });

    expect(screen.getByText("Your limit is 0: you can't receive this token.")).toBeVisible();
    expect(screen.queryByText("The limit must be above 0")).toBeNull();
    fireEvent.click(screen.getByText("Continue"));
    expect(transitionTo).not.toHaveBeenCalled();
  });

  it("shows no limit 0 message when the new limit is above 0", () => {
    renderStepSettings({ tokenAccount: makeHeldTokenAccount(0) });

    expect(screen.queryByText("Your limit is 0: you can't receive this token.")).toBeNull();
  });
});
