import BigNumber from "bignumber.js";
import React from "react";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { render, screen, userEvent } from "tests/testSetup";
import i18n from "~/renderer/i18n/init";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import { ALEO_MAIN_ACCOUNT } from "../../__mocks__/account.mock";
import { makeAleoTransaction } from "../../__mocks__/transaction.mock";
import { makeBondStepProps } from "../../__mocks__/stepProps.mock";
import type { StepProps } from "../types";
import StepAmount, { StepAmountFooter } from "./StepAmount";

jest.mock("~/renderer/modals/Send/fields/AmountField", () => ({
  __esModule: true,
  default: () => <div data-testid="amount-field" />,
}));
jest.mock("~/renderer/components/SpendableBanner", () => ({
  __esModule: true,
  default: () => <div data-testid="spendable-banner" />,
}));
jest.mock("~/renderer/modals/Send/AccountFooter", () => ({
  __esModule: true,
  default: () => <div data-testid="account-footer" />,
}));
jest.mock("~/renderer/components/ErrorBanner", () => ({
  __esModule: true,
  default: ({ error }: { error: Error }) => <div data-testid="error-banner">{error.name}</div>,
}));

const VALIDATOR = "aleo1q3vx8pet0h7739hx5xlekfxh9kus6qdlxhx9qdkxhh9rnva8q5gsskve3t";

const withStatusErrors = (errors: Record<string, Error>): Partial<StepProps> => ({
  status: {
    errors,
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  },
});

const continueButton = () => screen.getByRole("button", { name: "Continue" });

function setup(Component: React.ComponentType<StepProps>, overrides: Partial<StepProps> = {}) {
  const props = makeBondStepProps({
    t: i18n.t.bind(i18n),
    account: ALEO_MAIN_ACCOUNT,
    transaction: makeAleoTransaction({ mode: "bond_public", recipient: VALIDATOR }),
    ...overrides,
  });
  const utils = render(<Component {...props} />, {
    initialState: { settings: AFTER_ONBOARDING_STATE },
  });

  return { ...utils, props };
}

describe("Aleo bond StepAmount", () => {
  it("renders the amount field with the minimum-stake hint", () => {
    setup(StepAmount);

    expect(screen.getByTestId("amount-field")).toBeInTheDocument();
    expect(screen.getByText(/must reach at least 10,000 ALEO/)).toBeInTheDocument();
  });

  it("surfaces a step error above the fields", () => {
    setup(StepAmount, { error: new NotEnoughBalance() });

    expect(screen.getByTestId("error-banner")).toHaveTextContent("NotEnoughBalance");
  });

  // AmountField renders an amount error inline, so banning the fee banner alongside it
  // keeps the same shortfall from being reported twice.
  it("hides the fee error while the amount itself is also invalid", () => {
    setup(StepAmount, withStatusErrors({ amount: new NotEnoughBalance(), fees: new Error("fee") }));

    expect(screen.queryByTestId("error-banner")).not.toBeInTheDocument();
  });

  it("shows the fee error on its own once the amount is valid", () => {
    setup(StepAmount, withStatusErrors({ fees: new NotEnoughBalance() }));

    expect(screen.getByTestId("error-banner")).toHaveTextContent("NotEnoughBalance");
  });

  it("renders nothing without a status", () => {
    const { container } = setup(StepAmount, {
      status: undefined as unknown as StepProps["status"],
    });

    expect(container).toBeEmptyDOMElement();
  });
});

describe("Aleo bond StepAmountFooter", () => {
  it("moves on to the device step", async () => {
    const { props } = setup(StepAmountFooter);

    await userEvent.click(continueButton());

    expect(props.transitionTo).toHaveBeenCalledWith("connectDevice");
  });

  it("blocks Continue while the bridge is still preparing", () => {
    setup(StepAmountFooter, { bridgePending: true });

    expect(continueButton()).toBeDisabled();
  });

  it.each(["amount", "fees", "recipient"])("blocks Continue on a %s error", key => {
    setup(StepAmountFooter, withStatusErrors({ [key]: new NotEnoughBalance() }));

    expect(continueButton()).toBeDisabled();
  });

  it("renders nothing without an account", () => {
    const { container } = setup(StepAmountFooter, { account: null });

    expect(container).toBeEmptyDOMElement();
  });
});
