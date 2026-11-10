import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account } from "@ledgerhq/types-live";
import { act, render, screen } from "tests/testSetup";
import { setDrawer } from "~/renderer/drawers/Provider";
import PerpsDepositRoot, { openPerpsDeposit } from "../PerpsDepositDialog";
import PerpsReviewRoot from "../../PerpsReview/PerpsReviewDialog";

const mockOpenAssetAndAccount = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Perps/deposit/useWalletApiSpendableBalance", () => ({
  useWalletApiSpendableBalance: (account?: { spendableBalance: unknown }) => ({
    balance: account?.spendableBalance,
    isRefreshing: false,
  }),
}));

jest.mock("LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer", () => ({
  useOpenAssetAndAccount: () => ({
    openAssetAndAccountPromise: (params: unknown) => mockOpenAssetAndAccount(params),
  }),
}));

// Countervalues are priced 1:1 with the account balance so the form ceiling is
// predictable: a balance of 10_000 (2 decimals for USD) means a $100 maximum.
jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useCalculateCountervalueCallback: () => (_currency: unknown, value: BigNumber) => value,
}));

jest.mock("@domain/entity-market-countervalues", () => ({
  ...jest.requireActual("@domain/entity-market-countervalues"),
  calculate: () => 1e16,
}));

const mockUsePerpsDepositQuote = jest.fn();
jest.mock("@ledgerhq/live-common/wallet-api/Perps/deposit/useDepositQuote", () => ({
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
      result: { quote: { amountTo: new BigNumber(42), errors: [] }, errors: [] },
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

  it("should keep a partially typed decimal while the amount is edited", async () => {
    const { user } = renderDeposit();

    act(() => openPerpsDeposit({ receiverAccount }));

    const input = screen.getByTestId("perps-deposit-amount-input");
    // The field reads zero until something is entered, and never goes blank.
    expect(input).toHaveValue("0");

    await user.type(input, "1.50");
    expect(input).toHaveValue("1.50");

    // Deleting back across the separator leaves the dot in place, so the next
    // digit lands in the decimals rather than the integers.
    await user.type(input, "{Backspace}{Backspace}");
    expect(input).toHaveValue("1.");

    await user.type(input, "{Backspace}{Backspace}");
    expect(input).toHaveValue("0");
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

  it("should tell the user when the provider has no quote for the pair", async () => {
    mockUsePerpsDepositQuote.mockReturnValue({
      result: { errors: [{ code: "noQuotes" }] },
      isLoading: false,
    });
    const { user } = renderDeposit();

    act(() => openPerpsDeposit({ receiverAccount }));

    await user.click(screen.getByTestId("perps-deposit-select-currency"));
    await user.click(screen.getByTestId("perps-deposit-ratio-MAX"));

    expect(screen.getByTestId("perps-deposit-form-error")).toHaveTextContent(
      "We can’t get a quote from SwapKit, try with a different asset or come back later.",
    );
    // The message replaces the provider notice instead of stacking with it.
    expect(screen.queryByText("Swap and deposit via SwapKit")).not.toBeInTheDocument();
    // The amount is what cannot be quoted, so the field carries the error too.
    expect(screen.getByTestId("perps-deposit-amount-input")).toBeInvalid();
    expect(screen.getByTestId("perps-deposit-review-cta")).toBeDisabled();
  });

  it("should explain a minimum amount in the same dialog, and come back to the form", async () => {
    mockUsePerpsDepositQuote.mockReturnValue({
      result: { errors: [{ code: "amountTooLow", minAmount: "0.004" }] },
      isLoading: false,
    });
    const { user } = renderDeposit();

    act(() => openPerpsDeposit({ receiverAccount }));
    await user.click(screen.getByTestId("perps-deposit-select-currency"));
    await user.click(screen.getByTestId("perps-deposit-ratio-MAX"));

    expect(screen.getByTestId("perps-deposit-form-error")).toHaveTextContent(
      "Enter at least 0.004 ETH and try again.",
    );

    await user.click(screen.getByTestId("perps-deposit-learn-more"));

    expect(screen.getByRole("dialog", { name: "Minimum required for ETH" })).toBeVisible();
    expect(screen.getByText("A minimum value of 0.004 ETH is required for quotes")).toBeVisible();
    expect(screen.getByTestId("perps-deposit-details-buy")).toHaveTextContent("Buy ETH");
    expect(screen.queryByTestId("perps-deposit-amount-input")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /back/i }));

    expect(screen.getByTestId("perps-deposit-amount-input")).toBeVisible();
  });

  it("should start a new request on the form, not on the details of the previous one", async () => {
    mockUsePerpsDepositQuote.mockReturnValue({
      result: { errors: [{ code: "amountTooLow", minAmount: "0.004" }] },
      isLoading: false,
    });
    const { user } = renderDeposit();

    act(() => openPerpsDeposit({ receiverAccount }));
    await user.click(screen.getByTestId("perps-deposit-select-currency"));
    await user.click(screen.getByTestId("perps-deposit-ratio-MAX"));
    await user.click(screen.getByTestId("perps-deposit-learn-more"));

    act(() => openPerpsDeposit({ receiverAccount }));

    expect(screen.getByTestId("perps-deposit-amount-input")).toBeVisible();
    expect(screen.queryByTestId("perps-deposit-details")).not.toBeInTheDocument();
  });

  it("should shimmer the quoted amount and keep the CTA disabled while quoting", async () => {
    mockUsePerpsDepositQuote.mockReturnValue({ result: undefined, isLoading: true });
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

  it("should hand over to the review dialog when the form is submitted", async () => {
    const { user } = render(
      <>
        <PerpsDepositRoot />
        <PerpsReviewRoot />
      </>,
      { initialState: { accounts: [fundingAccount] } },
    );

    act(() =>
      openPerpsDeposit({
        receiverAccount,
        draft: { depositAccount: fundingAccount, depositAmount: 20 },
      }),
    );

    await user.click(screen.getByTestId("perps-deposit-review-cta"));

    // The deposit form gives way to the review, which knows what is being sent.
    expect(await screen.findByTestId("perps-deposit-cta")).toBeVisible();
    expect(screen.getByTestId("perps-deposit-amount-sent")).toBeVisible();
    expect(screen.queryByTestId("perps-deposit-amount-input")).not.toBeInTheDocument();
  });

  it("should step aside for the add account drawer and come back with the new account", async () => {
    let resolvePick: (result: { account: Account }) => void = () => undefined;
    mockOpenAssetAndAccount.mockReturnValue(
      new Promise(resolve => {
        resolvePick = resolve;
      }),
    );
    const { user } = renderDeposit();

    act(() => openPerpsDeposit({ receiverAccount }));

    await user.type(screen.getByTestId("perps-deposit-amount-input"), "20");
    await user.click(screen.getByTestId("perps-deposit-select-currency"));
    act(() => setDrawer(() => null, {}));

    expect(screen.queryByTestId("perps-deposit-amount-input")).not.toBeInTheDocument();

    await act(async () => resolvePick({ account: fundingAccount }));
    act(() => setDrawer());

    expect(await screen.findByTestId("perps-deposit-amount-input")).toHaveValue("20");
    expect(screen.getByTestId("perps-deposit-review-cta")).not.toBeDisabled();
  });
});
