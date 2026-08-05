import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { AccountLike } from "@ledgerhq/types-live";
import { act, render, screen } from "tests/testSetup";
import PerpsDepositRoot, { openPerpsDeposit } from "../PerpsDepositDialog";

const mockOpenAssetAndAccount = jest.fn();
jest.mock("LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer", () => ({
  useOpenAssetAndAccount: () => ({
    openAssetAndAccountPromise: (params: unknown) => mockOpenAssetAndAccount(params),
  }),
}));

// Countervalues are priced 1:1 with the account balance so the form ceiling is
// predictable: a balance of 10_000 (2 decimals for USD) means a $100 maximum.
jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculateCountervalueCallback: () => (_currency: unknown, value: BigNumber) => value,
}));

function createAccount(id: string, spendableBalance: number): AccountLike {
  return {
    type: "Account",
    id,
    currency: getCryptoCurrencyById("ethereum"),
    spendableBalance: new BigNumber(spendableBalance),
    balance: new BigNumber(spendableBalance),
  } as AccountLike;
}

const receiverAccount = createAccount("receiver-1", 0);
const fundingAccount = createAccount("funding-1", 10000);

describe("PerpsDeposit integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenAssetAndAccount.mockResolvedValue({ account: fundingAccount });
  });

  it("should not render the form until a deposit is opened", () => {
    render(<PerpsDepositRoot />);

    expect(screen.queryByTestId("perps-deposit-amount-input")).not.toBeInTheDocument();
  });

  it("should let the user pick a funding account before reviewing", async () => {
    const { user } = render(<PerpsDepositRoot />);

    act(() => openPerpsDeposit({ receiverAccount }));

    expect(screen.getByTestId("perps-deposit-amount-input")).toBeVisible();
    // No funding account and no amount yet, so the review CTA stays disabled.
    expect(screen.getByTestId("perps-deposit-review-cta")).toBeDisabled();

    await user.click(screen.getByTestId("perps-deposit-select-currency"));

    expect(mockOpenAssetAndAccount).toHaveBeenCalledWith(
      expect.objectContaining({ uiUseCase: "perpetuals:deposit" }),
    );
  });

  it("should enable the review CTA once a funding account and amount are entered", async () => {
    const { user } = render(<PerpsDepositRoot />);

    act(() => openPerpsDeposit({ receiverAccount }));

    await user.click(screen.getByTestId("perps-deposit-select-currency"));
    await user.click(screen.getByTestId("perps-deposit-ratio-MAX"));

    expect(screen.getByTestId("perps-deposit-review-cta")).not.toBeDisabled();
  });

  it("should restore a draft when the deposit is reopened from the review", () => {
    render(<PerpsDepositRoot />);

    act(() =>
      openPerpsDeposit({
        receiverAccount,
        draft: { depositAccount: fundingAccount, depositAmount: 20 },
      }),
    );

    expect(screen.getByTestId("perps-deposit-amount-input")).toHaveValue("20");
    expect(screen.getByTestId("perps-deposit-review-cta")).not.toBeDisabled();
  });
});
