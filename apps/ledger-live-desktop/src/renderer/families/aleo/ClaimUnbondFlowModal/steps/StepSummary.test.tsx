import BigNumber from "bignumber.js";
import React from "react";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { AleoNoClaimableUnbondedFunds } from "@ledgerhq/live-common/families/aleo/errors";
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

  it("shows the claimable amount read-only", () => {
    setup(StepSummary);

    const input = screen.getByTestId("claim-summary-amount");
    expect(input).toHaveValue("15,000");
    expect(input).toHaveAttribute("readonly");
  });

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

  // The flow has no `AmountField` to carry `errors.amount`, so the step has to render it or the
  // reason Continue is disabled never reaches the screen.
  it("surfaces the amount error when nothing has matured", () => {
    setup(StepSummary, withStatusErrors({ amount: new AleoNoClaimableUnbondedFunds() }));

    expect(screen.getByTestId("error-banner")).toHaveTextContent("AleoNoClaimableUnbondedFunds");
  });

  it("hides the fee error while the amount itself is also invalid", () => {
    setup(
      StepSummary,
      withStatusErrors({
        amount: new AleoNoClaimableUnbondedFunds(),
        fees: new NotEnoughBalance(),
      }),
    );

    const banners = screen.getAllByTestId("error-banner");
    expect(banners).toHaveLength(1);
    expect(banners[0]).toHaveTextContent("AleoNoClaimableUnbondedFunds");
  });

  it("shows the fee error on its own once the amount is valid", () => {
    setup(StepSummary, withStatusErrors({ fees: new NotEnoughBalance() }));

    expect(screen.getByTestId("error-banner")).toHaveTextContent("NotEnoughBalance");
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

  it.each(["amount", "fees", "recipient"])("blocks Continue on a %s error", key => {
    setup(StepSummaryFooter, withStatusErrors({ [key]: new NotEnoughBalance() }));

    expect(continueButton()).toBeDisabled();
  });

  it("renders nothing without an account", () => {
    const { container } = setup(StepSummaryFooter, { account: null });

    expect(container).toBeEmptyDOMElement();
  });
});
