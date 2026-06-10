import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { FeeNotLoaded, NotEnoughBalanceFees } from "@ledgerhq/errors";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { StepProps } from "~/renderer/modals/Send/types";
import SendStepAmount, { FEES_BANNER_TESTID } from "./SendStepAmount";

// Mocked: rendering the real DefaultStepAmount needs the Send modal's Redux store + bridge.
jest.mock("~/renderer/modals/Send/steps/StepAmount", () => ({
  __esModule: true,
  DefaultStepAmount: () => <div data-testid="default-step-amount" />,
}));

function buildStatus(errors: TransactionStatus["errors"] = {}): TransactionStatus {
  return {
    errors,
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  };
}

function buildProps(overrides: Partial<StepProps> = {}): StepProps {
  return {
    status: buildStatus(),
    error: undefined,
    bridgePending: false,
    ...overrides,
  } as StepProps;
}

describe("Celo SendStepAmount", () => {
  it("should render the fees banner when status.errors.fees is a NotEnoughBalanceFees", () => {
    render(
      <SendStepAmount
        {...buildProps({ status: buildStatus({ fees: new NotEnoughBalanceFees() }) })}
      />,
    );
    expect(screen.getByTestId(FEES_BANNER_TESTID)).toBeVisible();
    expect(screen.getByTestId("default-step-amount")).toBeVisible();
  });

  it("should hide the banner when there is no errors.fees", () => {
    render(<SendStepAmount {...buildProps()} />);
    expect(screen.queryByTestId(FEES_BANNER_TESTID)).not.toBeInTheDocument();
    expect(screen.getByTestId("default-step-amount")).toBeVisible();
  });

  it("should suppress the banner when bridgePending is true (avoids transient-state flicker)", () => {
    render(
      <SendStepAmount
        {...buildProps({
          status: buildStatus({ fees: new NotEnoughBalanceFees() }),
          bridgePending: true,
        })}
      />,
    );
    expect(screen.queryByTestId(FEES_BANNER_TESTID)).not.toBeInTheDocument();
  });

  it("should not render the banner when status.errors.fees is a class other than NotEnoughBalanceFees", () => {
    render(
      <SendStepAmount {...buildProps({ status: buildStatus({ fees: new FeeNotLoaded() }) })} />,
    );
    expect(screen.queryByTestId(FEES_BANNER_TESTID)).not.toBeInTheDocument();
  });

  it("should suppress the banner when a top-level error is shown by the default step", () => {
    render(
      <SendStepAmount
        {...buildProps({
          status: buildStatus({ fees: new NotEnoughBalanceFees() }),
          error: new Error("connection lost"),
        })}
      />,
    );
    expect(screen.queryByTestId(FEES_BANNER_TESTID)).not.toBeInTheDocument();
  });
});
