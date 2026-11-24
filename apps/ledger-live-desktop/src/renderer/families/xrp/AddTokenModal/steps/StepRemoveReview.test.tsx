import React from "react";
import BigNumber from "bignumber.js";
import { XrpOptOutTokenInEscrow } from "@ledgerhq/live-common/families/xrp/types";
import { render, screen } from "tests/testSetup";
import type { StepProps } from "../types";
import StepRemoveReview, { StepRemoveReviewFooter } from "./StepRemoveReview";
import { makeStepProps } from "../../__mocks__/stepProps.mock";
import { XRP_IOU_TOKEN_ACCOUNT } from "../../__mocks__/account.mock";
import { xrpIouToken, xrpRlusdToken } from "../../__mocks__/currency.mock";
import { makeStatus, reserveRelease } from "../../__mocks__/transaction.mock";

// The XRP family has no fee footer of its own: this spares the dynamic import AccountFooter waits on
jest.mock("~/renderer/families", () => ({
  ...jest.requireActual("~/renderer/families"),
  useLLDCoinFamily: () => undefined,
}));

const mockOpenSendFlow = jest.fn();
jest.mock("LLD/features/Send/hooks/useOpenSendFlow", () => ({
  useOpenSendFlow: () => mockOpenSendFlow,
}));

const emptyTokenAccount = { ...XRP_IOU_TOKEN_ACCOUNT, balance: new BigNumber(0) };
const heldTokenAccount = { ...XRP_IOU_TOKEN_ACCOUNT, balance: new BigNumber(25) };

const removeStatus = makeStatus({}, { reserve: reserveRelease });

function renderReview(overrides: Partial<StepProps>) {
  const props = makeStepProps({
    action: "remove",
    token: xrpIouToken,
    tokenAccount: emptyTokenAccount,
    status: removeStatus,
    ...overrides,
  });

  render(
    <>
      <StepRemoveReview {...props} />
      <StepRemoveReviewFooter {...props} />
    </>,
  );

  return props;
}

describe("StepRemoveReview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the reserve the removal unlocks once, and lets the removal go on", () => {
    const { transitionTo } = renderReview({});

    expect(screen.getByText("0.2 XRP will be unlocked and available again.")).toBeVisible();
    expect(
      screen.getByText(
        "You won't be able to receive this token anymore. You can add it again later (0.2 XRP will be locked again).",
      ),
    ).toBeVisible();
    expect(screen.queryByText("Rippling")).toBeNull();
    expect(screen.queryByText(/locked for this token will be released/)).toBeNull();

    screen.getByRole("button", { name: "Continue" }).click();

    expect(transitionTo).toHaveBeenCalledTimes(1);
    expect(transitionTo).toHaveBeenCalledWith("connectDevice");
  });

  it("shortens the issuer, with the full address on hover", () => {
    renderReview({ token: xrpRlusdToken });

    expect(screen.getByTitle(xrpRlusdToken.contractAddress)).toHaveTextContent("r9fn...Cek4");
  });

  it("blocks Continue on coin-xrp's error", () => {
    renderReview({ status: makeStatus({ transaction: new XrpOptOutTokenInEscrow() }) });

    expect(screen.getByText("Some of this token is in escrow")).toBeVisible();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("asks to send a held balance first, with Send instead of Continue", () => {
    const { onClose, account } = renderReview({ tokenAccount: heldTokenAccount });

    expect(
      screen.getByText("You still hold 25 RLUSD. Send your balance before removing this token."),
    ).toBeVisible();
    expect(screen.queryByText("Issuer")).toBeNull();
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();

    screen.getByRole("button", { name: "Send" }).click();

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockOpenSendFlow).toHaveBeenCalledTimes(1);
    expect(mockOpenSendFlow).toHaveBeenCalledWith({
      account: heldTokenAccount,
      parentAccount: account,
    });
  });
});
