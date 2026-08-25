import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account } from "@ledgerhq/types-live";
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

const mockUsePerpsDepositQuote = jest.fn();
jest.mock("../usePerpsDepositQuote", () => ({
  usePerpsDepositQuote: () => mockUsePerpsDepositQuote(),
}));

function createAccount(id: string, spendableBalance: number): Account {
  return {
    ...genAccount(id, { currency: getCryptoCurrencyById("ethereum"), operationsSize: 0 }),
    spendableBalance: new BigNumber(spendableBalance),
    balance: new BigNumber(spendableBalance),
  };
}

const receiverAccount = createAccount("receiver-1", 0);
const fundingAccount = createAccount("funding-1", 10000);

/** The funding account is read back from the store, so it has to live there. */
function renderDeposit() {
  return render(<PerpsDepositRoot />, { initialState: { accounts: [fundingAccount] } });
}

describe("PerpsDeposit integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenAssetAndAccount.mockResolvedValue({ account: fundingAccount });
    mockUsePerpsDepositQuote.mockReturnValue({
      quote: { amountTo: new BigNumber(42) },
      isLoading: false,
    });
  });

  it("should not render the form until a deposit is opened", () => {
    renderDeposit();

    expect(screen.queryByTestId("perps-deposit-amount-input")).not.toBeInTheDocument();
  });

  it("should let the user pick a funding account before reviewing", async () => {
    const { user } = renderDeposit();

    act(() => openPerpsDeposit({ receiverAccount }));

    expect(screen.getByTestId("perps-deposit-amount-input")).toBeVisible();
    // No funding account and no amount yet, so the review CTA stays disabled.
    expect(screen.getByTestId("perps-deposit-review-cta")).toBeDisabled();

    await user.click(screen.getByTestId("perps-deposit-select-currency"));

    expect(mockOpenAssetAndAccount).toHaveBeenCalledWith(
      expect.objectContaining({ uiUseCase: "perpetuals:fund" }),
    );
  });

  it("should enable the review CTA once a funding account and amount are entered", async () => {
    const { user } = renderDeposit();

    act(() => openPerpsDeposit({ receiverAccount }));

    await user.click(screen.getByTestId("perps-deposit-select-currency"));
    await user.click(screen.getByTestId("perps-deposit-ratio-MAX"));

    expect(screen.getByTestId("perps-deposit-review-cta")).not.toBeDisabled();
  });

  it("should only advertise the provider once an amount is entered", async () => {
    const { user } = renderDeposit();

    act(() => openPerpsDeposit({ receiverAccount }));

    expect(screen.queryByText("Swap and deposit via SwapKit")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("perps-deposit-select-currency"));
    await user.click(screen.getByTestId("perps-deposit-ratio-MAX"));

    expect(screen.getByText("Swap and deposit via SwapKit")).toBeVisible();
  });

  it("should shimmer the quoted amount and keep the CTA disabled while quoting", async () => {
    mockUsePerpsDepositQuote.mockReturnValue({ quote: undefined, isLoading: true });
    const { user } = renderDeposit();

    act(() => openPerpsDeposit({ receiverAccount }));

    await user.click(screen.getByTestId("perps-deposit-select-currency"));
    await user.click(screen.getByTestId("perps-deposit-ratio-MAX"));

    expect(screen.getByTestId("perps-deposit-quote-skeleton")).toBeVisible();
    expect(screen.getByTestId("perps-deposit-review-cta")).toBeDisabled();
  });

  it("should restore a draft when the deposit is reopened from the review", () => {
    renderDeposit();

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
