import React from "react";
import BigNumber from "bignumber.js";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import { XrpTrustLimitZero } from "@ledgerhq/live-common/families/xrp/types";
import { fireEvent, render, screen } from "tests/testSetup";
import type { StepProps } from "../types";
import StepReview, { StepReviewFooter } from "./StepReview";
import { makeStepProps } from "../../__mocks__/stepProps.mock";
import { xrpMptToken } from "../../__mocks__/currency.mock";

jest.mock("~/renderer/modals/Send/AccountFooter", () => ({
  __esModule: true,
  default: () => null,
}));

const withLimitError = {
  errors: { amount: new XrpTrustLimitZero() },
  warnings: {},
} as unknown as TransactionStatus;

function renderReview(overrides: Partial<StepProps> = {}) {
  const props = makeStepProps({
    transaction: { amount: new BigNumber(1000) } as Transaction,
    ...overrides,
  });
  render(
    <>
      <StepReview {...props} />
      <StepReviewFooter {...props} />
    </>,
  );
  return props;
}

describe("StepReview", () => {
  it("shows an IOU with its issuer, limit and rippling", () => {
    renderReview({ isRippling: true });

    expect(screen.getByText("RLUSD (RLUSD)")).toBeVisible();
    expect(screen.getByText("rIssuer")).toBeVisible();
    expect(screen.getByText("1,000 RLUSD")).toBeVisible();
    expect(screen.getByText("On")).toBeVisible();
  });

  it("shows no limit or rippling for an MPT", () => {
    renderReview({ token: xrpMptToken });

    expect(screen.getByText("Test MPT (TMPT)")).toBeVisible();
    expect(screen.queryByText("Trust limit")).toBeNull();
    expect(screen.queryByText("Rippling")).toBeNull();
  });

  it("continues to the device", () => {
    const { transitionTo } = renderReview();

    fireEvent.click(screen.getByText("Continue"));

    expect(transitionTo).toHaveBeenCalledWith("connectDevice");
  });

  it("shows a transaction error and blocks the device step", () => {
    const { transitionTo } = renderReview({ status: withLimitError });

    expect(screen.getByText("The limit must be above 0")).toBeVisible();
    fireEvent.click(screen.getByText("Continue"));

    expect(transitionTo).not.toHaveBeenCalled();
  });

  it("waits for the bridge before the device step", () => {
    renderReview({ bridgePending: true });

    expect(screen.getByRole("button")).toBeDisabled();
  });
});
