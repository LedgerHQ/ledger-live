import BigNumber from "bignumber.js";
import React from "react";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { render, screen, userEvent } from "tests/testSetup";
import i18n from "~/renderer/i18n/init";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import {
  ALEO_CLAIMABLE_ACCOUNT,
  ALEO_MAIN_ACCOUNT,
  ALEO_UNBONDING_ACCOUNT,
} from "../../__mocks__/account.mock";
import { makeAleoTransaction } from "../../__mocks__/transaction.mock";
import { makeClaimStepProps } from "../../__mocks__/stepProps.mock";
import type { StepProps } from "../types";
import StepSummary, { StepSummaryFooter } from "./StepSummary";

jest.mock("~/renderer/modals/Send/AccountFooter", () => ({
  __esModule: true,
  default: () => <div data-testid="account-footer" />,
}));
jest.mock("~/renderer/components/ErrorBanner", () => ({
  __esModule: true,
  default: ({ error }: { error: Error }) => <div data-testid="error-banner">{error.name}</div>,
}));

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
  const props = makeClaimStepProps({
    t: i18n.t.bind(i18n),
    account: ALEO_CLAIMABLE_ACCOUNT,
    transaction: makeAleoTransaction({
      mode: "claim_unbond_public",
      recipient: ALEO_CLAIMABLE_ACCOUNT.freshAddress,
    }),
    ...overrides,
  });
  const utils = render(<Component {...props} />, {
    initialState: { settings: AFTER_ONBOARDING_STATE },
  });

  return { ...utils, props };
}

describe("Aleo claim StepSummary", () => {
  it("explains what the claim does", () => {
    setup(StepSummary);

    expect(screen.getByTestId("claim-info-banner")).toHaveTextContent(
      /unbonding period has elapsed/,
    );
  });

  // The chain releases whatever has finished unbonding, so the amount is shown read-only for
  // the user to check rather than as something they pick.
  it("shows the claimable amount read-only", () => {
    setup(StepSummary);

    const input = screen.getByTestId("claim-summary-amount");
    expect(input).toHaveValue("15,000");
    expect(input).toHaveAttribute("readonly");
  });

  // The unbonding position is still counting down: nothing is claimable yet, so showing a
  // figure would imply the user can act on it.
  it("hides the amount while the unbonding height has not been reached", () => {
    setup(StepSummary, { account: ALEO_UNBONDING_ACCOUNT });

    expect(screen.queryByTestId("claim-summary-amount")).not.toBeInTheDocument();
  });

  it("hides the amount when the account carries no unbonding position", () => {
    setup(StepSummary, { account: ALEO_MAIN_ACCOUNT });

    expect(screen.queryByTestId("claim-summary-amount")).not.toBeInTheDocument();
  });

  it("surfaces a step error above the summary", () => {
    setup(StepSummary, { error: new NotEnoughBalance() });

    expect(screen.getByTestId("error-banner")).toHaveTextContent("NotEnoughBalance");
  });

  it("hides the fee error while the amount itself is also invalid", () => {
    setup(
      StepSummary,
      withStatusErrors({ amount: new NotEnoughBalance(), fees: new Error("fee") }),
    );

    expect(screen.queryByTestId("error-banner")).not.toBeInTheDocument();
  });

  it("shows the fee error on its own once the amount is valid", () => {
    setup(StepSummary, withStatusErrors({ fees: new NotEnoughBalance() }));

    expect(screen.getByTestId("error-banner")).toHaveTextContent("NotEnoughBalance");
  });

  it("renders nothing without a status", () => {
    const { container } = setup(StepSummary, {
      status: undefined as unknown as StepProps["status"],
    });

    expect(container).toBeEmptyDOMElement();
  });
});

describe("Aleo claim StepSummaryFooter", () => {
  it("moves on to the device step", async () => {
    const { props } = setup(StepSummaryFooter);

    await userEvent.click(continueButton());

    expect(props.transitionTo).toHaveBeenCalledWith("connectDevice");
  });

  it("blocks Continue while the bridge is still preparing", () => {
    setup(StepSummaryFooter, { bridgePending: true });

    expect(continueButton()).toBeDisabled();
  });

  // AleoNoClaimableAmount lands on `status.errors.amount`, so the user cannot sign a claim
  // that the chain would reject.
  it.each(["amount", "fees", "recipient"])("blocks Continue on a %s error", key => {
    setup(StepSummaryFooter, withStatusErrors({ [key]: new NotEnoughBalance() }));

    expect(continueButton()).toBeDisabled();
  });

  it("renders nothing without an account", () => {
    const { container } = setup(StepSummaryFooter, { account: null });

    expect(container).toBeEmptyDOMElement();
  });
});
