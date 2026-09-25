import BigNumber from "bignumber.js";
import { CryptoCurrencyIdSchema, getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { type TokenCurrency, TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { act, renderHook } from "tests/testSetup";
import { PERPS_DEPOSIT_DEFAULT_FUNDING_CURRENCY_ID } from "../../../constants/depositFunding";
import { usePerpsDepositViewModel, type PerpsDepositData } from "../usePerpsDepositViewModel";

const mockOpenAssetAndAccount = jest.fn();
jest.mock("LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer", () => ({
  useOpenAssetAndAccount: () => ({
    openAssetAndAccountPromise: (params: unknown) => mockOpenAssetAndAccount(params),
  }),
}));

const mockOpenPerpsReview = jest.fn();
jest.mock("../../PerpsReview/PerpsReviewDialog", () => ({
  openPerpsReview: (data: unknown) => mockOpenPerpsReview(data),
}));

// Countervalues are priced 1:1 in both directions, so the form ceiling is predictable:
// a balance of 10_000 (2 decimals for USD) means a $100 maximum.
const mockCalculateCountervalue = jest.fn((_currency: unknown, value: BigNumber) => value);
jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculateCountervalueCallback: () => (currency: unknown, value: BigNumber) =>
    mockCalculateCountervalue(currency, value),
  useCountervaluesState: () => ({}),
}));

// Prices the typed amount back into the funding currency, in its smallest unit.
const mockCalculate = jest.fn();
jest.mock("@ledgerhq/live-countervalues/logic", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues/logic"),
  calculate: (...args: unknown[]) => mockCalculate(...args),
}));

const mockUsePerpsDepositQuote = jest.fn();
jest.mock("../usePerpsDepositQuote", () => ({
  usePerpsDepositQuote: (params: unknown) => mockUsePerpsDepositQuote(params),
}));

function createAccount(id: string, currencyId: string, spendableBalance: number): Account {
  return {
    ...genAccount(id, { currency: getCryptoCurrencyById(currencyId), operationsSize: 0 }),
    spendableBalance: new BigNumber(spendableBalance),
    balance: new BigNumber(spendableBalance),
  };
}

const receiverAccount = createAccount("receiver-1", "ethereum", 0);
const fundingAccount = createAccount("funding-1", "ethereum", 10000);
const fundedAccount = createAccount("funding-2", "ethereum", 1e18);

const arbitrumUsdcToken: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse(PERPS_DEPOSIT_DEFAULT_FUNDING_CURRENCY_ID),
  contractAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  parentCurrencyId: CryptoCurrencyIdSchema.parse("arbitrum"),
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
};

const usdcParent = createAccount("usdc-parent", "arbitrum", 0);

/** A USDC-on-Arbitrum token account with a fixed spendable balance (atomic units). */
function createUsdcTokenAccount(id: string, spendableBalance: number): TokenAccount {
  return {
    ...genTokenAccount(0, usdcParent, arbitrumUsdcToken),
    id,
    spendableBalance: new BigNumber(spendableBalance),
    balance: new BigNumber(spendableBalance),
  };
}

/** Bundles token accounts under their parent so `flattenAccountsSelector` exposes them. */
function withUsdcAccounts(...tokenAccounts: TokenAccount[]): Account[] {
  return [{ ...usdcParent, subAccounts: tokenAccounts }, fundedAccount];
}

function renderViewModel(
  data: Partial<PerpsDepositData> = {},
  onClose = jest.fn(),
  discreetMode = false,
  accounts: Account[] = [fundingAccount, fundedAccount],
) {
  const props: PerpsDepositData = { receiverAccount, ...data };
  const { result } = renderHook(() => usePerpsDepositViewModel(props, onClose), {
    initialState: {
      accounts,
      settings: { discreetMode },
    },
  });
  return { result, onClose };
}

/** The display-unit amount the form settled on and sent to the provider. */
function quotedAmount(): string {
  return mockUsePerpsDepositQuote.mock.lastCall?.[0].amount;
}

/** The account arrives from a promise, so the picker has to settle before asserting. */
async function pickFundingAccount(result: { current: { pickDepositAccount: () => void } }) {
  await act(async () => {
    result.current.pickDepositAccount();
  });
}

describe("usePerpsDepositViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculateCountervalue.mockImplementation((_currency, value) => value);
    mockOpenAssetAndAccount.mockResolvedValue({ account: fundingAccount });
    mockCalculate.mockReturnValue(0);
    mockUsePerpsDepositQuote.mockReturnValue({
      quote: { amountTo: new BigNumber(42), quoteId: "quote-1" },
      isLoading: false,
      isUnavailable: false,
    });
  });

  it("starts with an empty amount and no funding account", () => {
    const { result } = renderViewModel();

    expect(result.current.depositAmount).toBe(0);
    expect(result.current.depositAccountName).toBeNull();
    expect(result.current.depositCurrencyTicker).toBe("USDC");
    expect(result.current.canReview).toBe(false);
  });

  it("leaves the deposit floor to the live app and only misses the funding account", () => {
    const { result } = renderViewModel();

    act(() => result.current.changeDepositAmount("3"));

    expect(result.current.depositAmount).toBe(3);
    expect(result.current.statusError).toBeNull();
    expect(result.current.missingAccount).toBe(true);
    expect(result.current.canReview).toBe(false);
  });

  it("ignores anything that is not a number in the typed amount", () => {
    const { result } = renderViewModel();

    act(() => result.current.changeDepositAmount("$1,2.50"));

    expect(result.current.depositAmount).toBe(12.5);
  });

  it("adopts the funding account picked in the asset drawer", async () => {
    const { result } = renderViewModel();

    act(() => result.current.changeDepositAmount("42"));
    await pickFundingAccount(result);

    expect(mockOpenAssetAndAccount).toHaveBeenCalledWith(
      expect.objectContaining({ uiUseCase: "perpetuals:fund" }),
    );

    expect(result.current.depositCurrencyTicker).toBe("ETH");
    expect(result.current.depositAccountName).not.toBeNull();
    // Picking a new funding account clears the amount, which was priced against the old one.
    expect(result.current.depositAmount).toBe(0);
    expect(result.current.maxAmount).toBe(100);
  });

  it("flags amounts above the funding balance", async () => {
    const { result } = renderViewModel();

    await pickFundingAccount(result);
    act(() => result.current.changeDepositAmount("150"));

    expect(result.current.exceedsBalance).toBe(true);
    expect(result.current.statusError).toEqual({
      labelKey: "perpsDeposit.formErrors.amountExceedsBalance",
    });
    expect(result.current.canReview).toBe(false);
  });

  it("holds back rather than blaming the balance while the funding rate is missing", async () => {
    mockCalculateCountervalue.mockReturnValue(null as unknown as BigNumber);
    const { result } = renderViewModel();

    await pickFundingAccount(result);
    act(() => result.current.changeDepositAmount("20"));

    expect(result.current.exceedsBalance).toBe(false);
    expect(result.current.statusError).toBeNull();
    expect(result.current.maxAmount).toBe(0);

    expect(result.current.canReview).toBe(false);
    expect(quotedAmount()).toBe("");
  });

  it("fills the whole funding balance when picking max", async () => {
    const { result } = renderViewModel();

    await pickFundingAccount(result);
    act(() => result.current.selectMax());

    expect(result.current.depositAmount).toBe(100);
    expect(result.current.exceedsBalance).toBe(false);
    expect(result.current.canReview).toBe(true);
  });

  it("restores the draft it was reopened with", () => {
    const { result } = renderViewModel({
      draft: { depositAccount: fundingAccount, depositAmount: 20 },
    });

    expect(result.current.depositAmount).toBe(20);
    expect(result.current.depositCurrencyTicker).toBe("ETH");
    expect(result.current.canReview).toBe(true);
  });

  it("quotes the typed amount converted into the funding currency", async () => {
    mockOpenAssetAndAccount.mockResolvedValue({ account: fundedAccount });

    mockCalculate.mockReturnValue(2.5e16);
    const { result } = renderViewModel();

    await pickFundingAccount(result);
    act(() => result.current.changeDepositAmount("20"));

    expect(quotedAmount()).toBe("0.025");
  });

  it("quotes no more than the funding account can spend", async () => {
    mockCalculate.mockReturnValue(2.5e16);
    const { result } = renderViewModel();

    await pickFundingAccount(result);
    act(() => result.current.changeDepositAmount("20"));

    expect(result.current.statusError).toBeNull();
    expect(quotedAmount()).toBe(new BigNumber(10000).shiftedBy(-18).toFixed());
  });

  it("floors a quote that lands between two atomic units", async () => {
    mockCalculate.mockReturnValue(1.6);
    const { result } = renderViewModel();

    await pickFundingAccount(result);
    act(() => result.current.changeDepositAmount("20"));

    expect(mockCalculate).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ reverse: true, disableRounding: true }),
    );
    expect(quotedAmount()).toBe(new BigNumber(1).shiftedBy(-18).toFixed());
  });

  it("hides both balances when discreet mode is on", async () => {
    const { result } = renderViewModel({}, jest.fn(), true);

    await pickFundingAccount(result);

    expect(result.current.headerDescription).toContain("***");
    expect(result.current.depositAccountCounterValue).toBe("$***");
  });

  it("holds the review CTA back until the quote lands", async () => {
    mockUsePerpsDepositQuote.mockReturnValue({
      quote: undefined,
      isLoading: true,
      isUnavailable: false,
    });
    const { result } = renderViewModel();

    await pickFundingAccount(result);
    act(() => result.current.changeDepositAmount("20"));

    // The form itself is valid, so only the missing quote keeps the CTA disabled.
    expect(result.current.statusError).toBeNull();
    expect(result.current.canReview).toBe(false);
    expect(result.current.isQuoteLoading).toBe(true);
    expect(result.current.formattedQuotedAmount).toBe("");
  });

  it("stops shimmering and explains itself when the provider has no quote", async () => {
    mockUsePerpsDepositQuote.mockReturnValue({
      quote: undefined,
      isLoading: false,
      isUnavailable: true,
    });
    const { result } = renderViewModel();

    await pickFundingAccount(result);
    act(() => result.current.changeDepositAmount("20"));

    // A pair the provider cannot route is an answer, not a pending request.
    expect(result.current.isQuoteLoading).toBe(false);
    expect(result.current.canReview).toBe(false);
    expect(result.current.statusError).toEqual({
      labelKey: "perpsDeposit.formErrors.quoteUnavailable",
    });
  });

  it("blames the balance rather than the provider when both are wrong", async () => {
    mockUsePerpsDepositQuote.mockReturnValue({
      quote: undefined,
      isLoading: false,
      isUnavailable: true,
    });
    const { result } = renderViewModel();

    await pickFundingAccount(result);
    act(() => result.current.changeDepositAmount("150"));

    expect(result.current.statusError).toEqual({
      labelKey: "perpsDeposit.formErrors.amountExceedsBalance",
    });
  });

  it("hands the review the amount converted into the funding currency", () => {
    mockCalculate.mockReturnValue(2.5e16);
    const { result, onClose } = renderViewModel({
      draft: { depositAccount: fundedAccount, depositAmount: 20 },
    });

    act(() => result.current.handleReview());

    expect(mockOpenPerpsReview).toHaveBeenCalledWith({
      receiverAccount,
      depositAccount: fundedAccount,
      amountSent: "0.025",
      amountTo: "42",
      quoteId: "quote-1",
      draft: { depositAccount: fundedAccount, depositAmount: 20 },
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("does not open the review while the form is incomplete", () => {
    const { result, onClose } = renderViewModel();

    act(() => result.current.changeDepositAmount("20"));
    act(() => result.current.handleReview());

    expect(mockOpenPerpsReview).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("defaults to the USDC funding account with the highest balance", () => {
    const { result } = renderViewModel(
      {},
      jest.fn(),
      false,
      withUsdcAccounts(
        createUsdcTokenAccount("usdc-zero", 0),
        createUsdcTokenAccount("usdc-low", 5000),
        createUsdcTokenAccount("usdc-high", 20000),
      ),
    );

    // The 20_000-atomic account wins; priced 1:1 into USD (2 decimals) that is a $200 ceiling.
    expect(result.current.maxAmount).toBe(200);
    expect(result.current.depositCurrencyTicker).toBe("USDC");
    expect(result.current.depositAccountName).not.toBeNull();
  });

  it("ignores zero-balance USDC accounts when choosing the default", () => {
    const { result } = renderViewModel(
      {},
      jest.fn(),
      false,
      withUsdcAccounts(createUsdcTokenAccount("usdc-zero", 0)),
    );

    // A null account name means nothing was defaulted; maxAmount only falls back to 0.
    expect(result.current.depositAccountName).toBeNull();
    expect(result.current.maxAmount).toBe(0);
  });
});
