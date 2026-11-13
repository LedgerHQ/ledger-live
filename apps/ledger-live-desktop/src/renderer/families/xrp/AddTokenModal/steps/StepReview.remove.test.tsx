import React from "react";
import BigNumber from "bignumber.js";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import { XrpOptOutBalanceNotZero } from "@ledgerhq/live-common/families/xrp/types";
import { render, screen } from "tests/testSetup";
import StepReview, { StepReviewFooter } from "./StepReview";
import { makeStepProps } from "../../__mocks__/stepProps.mock";

jest.mock("~/renderer/modals/Send/AccountFooter", () => ({
  __esModule: true,
  default: () => null,
}));

const reserveRelease = Object.assign(new Error(), {
  name: "XrpReserveRelease",
  amount: "0.2 XRP",
});

const removeStatus = {
  errors: {},
  warnings: { reserve: reserveRelease },
  estimatedFees: new BigNumber(0),
  amount: new BigNumber(0),
  totalSpent: new BigNumber(0),
} as unknown as TransactionStatus;

const balanceLeftStatus = {
  ...removeStatus,
  errors: { amount: new XrpOptOutBalanceNotZero() },
  warnings: {},
} as unknown as TransactionStatus;

describe("StepReview of a removal", () => {
  it("shows the unlocked reserve in the info banner, without limit or rippling", () => {
    render(
      <StepReview
        {...makeStepProps({
          action: "remove",
          status: removeStatus,
          transaction: { amount: new BigNumber(0) } as Transaction,
        })}
      />,
    );

    expect(
      screen.getByText(
        "0.2 XRP will be unlocked and available again. You won't be able to receive this token anymore. You can add it again later, which locks 0.2 XRP again.",
      ),
    ).toBeVisible();
    expect(screen.queryByText("Rippling")).toBeNull();
  });

  it("warns to send the balance first, and blocks Continue", () => {
    const props = makeStepProps({
      action: "remove",
      status: balanceLeftStatus,
      transaction: { amount: new BigNumber(0) } as Transaction,
    });
    render(
      <>
        <StepReview {...props} />
        <StepReviewFooter {...props} />
      </>,
    );

    expect(screen.getByText("This token still has a balance")).toBeVisible();
    expect(
      screen.getByText("Send your whole balance of this token before removing it."),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });
});
