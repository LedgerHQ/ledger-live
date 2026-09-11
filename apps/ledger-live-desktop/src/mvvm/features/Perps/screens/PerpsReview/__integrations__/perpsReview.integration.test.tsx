import React from "react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account } from "@ledgerhq/types-live";
import { act, render, screen } from "tests/testSetup";
import PerpsReviewRoot, { openPerpsReview } from "../PerpsReviewDialog";
import type { PerpsReviewData } from "../usePerpsReviewViewModel";

const mockOpenPerpsDeposit = jest.fn();
jest.mock("../../PerpsDeposit/PerpsDepositDialog", () => ({
  openPerpsDeposit: (data: unknown) => mockOpenPerpsDeposit(data),
}));

function createAccount(id: string): Account {
  return genAccount(id, { currency: getCryptoCurrencyById("ethereum"), operationsSize: 0 });
}

const depositAccount = createAccount("funding-1");
const receiverAccount = createAccount("receiver-1");

const reviewData: PerpsReviewData = {
  depositAccount,
  receiverAccount,
  amountSent: "0.02",
  amountTo: "0.019",
  draft: { depositAccount, depositAmount: 20 },
};

describe("PerpsReview integration", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should not render the review until a deposit is handed over", () => {
    render(<PerpsReviewRoot />);

    expect(screen.queryByTestId("perps-deposit-cta")).not.toBeInTheDocument();
  });

  it("should show what is swapped and where it lands once opened", () => {
    render(<PerpsReviewRoot />);

    act(() => openPerpsReview(reviewData));

    expect(screen.getByText("Swap details")).toBeVisible();
    expect(screen.getByTestId("perps-deposit-amount-sent")).toHaveTextContent(/0\.02\s?ETH/);
    // Everything downstream of the swap is a quote, so it reads as an estimate.
    expect(screen.getByTestId("perps-deposit-amount-received")).toHaveTextContent(/~0\.019\s?ETH/);
    expect(screen.getByTestId("perps-deposit-deposited-amount")).toHaveTextContent(/~0\.019\s?ETH/);
    expect(screen.getByTestId("perps-deposit-receiver-account")).toBeVisible();
    expect(screen.getByTestId("perps-deposit-cta")).toBeEnabled();
  });

  it("should hand the amount back to the deposit form when going back", async () => {
    const { user } = render(<PerpsReviewRoot />);

    act(() => openPerpsReview(reviewData));
    await user.click(screen.getByRole("button", { name: /back/i }));

    // The form reopens with the draft, so the user does not retype the amount.
    expect(mockOpenPerpsDeposit).toHaveBeenCalledWith({
      receiverAccount,
      draft: reviewData.draft,
    });
    expect(screen.queryByTestId("perps-deposit-cta")).not.toBeInTheDocument();
  });

  it("should close the review once the deposit is confirmed", async () => {
    const { user } = render(<PerpsReviewRoot />);

    act(() => openPerpsReview(reviewData));
    await user.click(screen.getByTestId("perps-deposit-cta"));

    expect(screen.queryByTestId("perps-deposit-cta")).not.toBeInTheDocument();
    expect(mockOpenPerpsDeposit).not.toHaveBeenCalled();
  });
});
