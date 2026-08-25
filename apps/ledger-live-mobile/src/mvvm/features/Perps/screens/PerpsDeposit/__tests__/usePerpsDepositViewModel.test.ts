import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account } from "@ledgerhq/types-live";
import { act, renderHook } from "@tests/test-renderer";
import { usePerpsDepositViewModel } from "../usePerpsDepositViewModel";

const mockOpenDrawer = jest.fn();
jest.mock("LLM/features/ModularDrawer", () => ({
  useModularDrawerController: () => ({ openDrawer: mockOpenDrawer }),
}));

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
/** Holds more than the form can ask for, so the balance cap never kicks in. */
const fundedAccount = createAccount("funding-2", "ethereum", 1e18);

function createProps(navigate = jest.fn()) {
  return {
    props: { navigation: { navigate }, route: { params: { receiverAccount } } } as never,
    navigate,
  };
}

/** The funding account is read back from the store, so it has to live there. */
function renderViewModel(props: never, discreetMode = false) {
  return renderHook(() => usePerpsDepositViewModel(props), {
    overrideInitialState: state => ({
      ...state,
      accounts: { ...state.accounts, active: [fundingAccount, fundedAccount] },
      settings: { ...state.settings, discreetMode },
    }),
  });
}

function selectFundingAccount(account: Account = fundingAccount) {
  const { onAccountSelected } = mockOpenDrawer.mock.calls[0][0];
  act(() => onAccountSelected(account));
}

/** The display-unit amount the form settled on and sent to the provider. */
function quotedAmount(): string {
  return mockUsePerpsDepositQuote.mock.lastCall?.[0].amount;
}

/** The keypad is the only way into the amount, so tests enter digits the same way. */
function typeAmount(pressAmountKey: (key: string) => void, amount: string) {
  act(() => [...amount].forEach(key => pressAmountKey(key)));
}

describe("usePerpsDepositViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculateCountervalue.mockImplementation((_currency, value) => value);
    mockCalculate.mockReturnValue(0);
    mockUsePerpsDepositQuote.mockReturnValue({
      quote: { amountTo: new BigNumber(42), quoteId: "quote-1" },
      isLoading: false,
      isUnavailable: false,
    });
  });

  it("starts with an empty amount and no funding account", () => {
    const { props } = createProps();
    const { result } = renderViewModel(props);

    expect(result.current.amountText).toBe("");
    expect(result.current.depositAmount).toBe(0);
    expect(result.current.depositAccountName).toBeNull();
    expect(result.current.depositCurrencyTicker).toBe("USDC");
    expect(result.current.canReview).toBe(false);
  });

  it("keeps partially typed decimals and leaves the deposit floor to the live app", () => {
    const { props } = createProps();
    const { result } = renderViewModel(props);

    typeAmount(result.current.pressAmountKey, "3.");

    expect(result.current.amountText).toBe("3.");
    expect(result.current.depositAmount).toBe(3);
    expect(result.current.statusError).toBeNull();
    expect(result.current.missingAccount).toBe(true);
    expect(result.current.canReview).toBe(false);
  });

  it("types, corrects and clears the amount from the keypad", () => {
    const { props } = createProps();
    const { result } = renderViewModel(props);

    act(() => ["5", "0", "0"].forEach(key => result.current.pressAmountKey(key)));
    expect(result.current.amountText).toBe("500");

    act(() => result.current.pressAmountKey("delete"));
    expect(result.current.amountText).toBe("50");

    // A leading separator is completed to "0." and repeats are ignored.
    act(() =>
      ["delete", "delete", ".", ".", "2", "5"].forEach(key => result.current.pressAmountKey(key)),
    );
    expect(result.current.amountText).toBe("0.25");

    // Extra decimals are refused, so the amount always matches what is displayed.
    act(() => result.current.pressAmountKey("9"));
    expect(result.current.amountText).toBe("0.25");
    expect(result.current.depositAmount).toBe(0.25);
  });

  it("adopts the funding account picked in the modular drawer", () => {
    const { props } = createProps();
    const { result } = renderViewModel(props);

    typeAmount(result.current.pressAmountKey, "42");
    act(() => result.current.pickDepositAccount());

    expect(mockOpenDrawer).toHaveBeenCalledWith(
      expect.objectContaining({
        enableAccountSelection: true,
        uiUseCase: "perpetuals:fund",
      }),
    );

    selectFundingAccount();

    expect(result.current.depositCurrencyTicker).toBe("ETH");
    expect(result.current.depositAccountName).not.toBeNull();

    expect(result.current.amountText).toBe("");
    expect(result.current.maxAmount).toBe(100);
  });

  it("flags amounts above the funding balance", () => {
    const { props } = createProps();
    const { result } = renderViewModel(props);

    act(() => result.current.pickDepositAccount());
    selectFundingAccount();
    typeAmount(result.current.pressAmountKey, "150");

    expect(result.current.exceedsBalance).toBe(true);
    expect(result.current.statusError).toEqual({
      labelKey: "perpsDeposit.formErrors.amountExceedsBalance",
    });
    expect(result.current.canReview).toBe(false);
  });

  it("holds back rather than blaming the balance while the funding rate is missing", () => {
    mockCalculateCountervalue.mockReturnValue(null as unknown as BigNumber);
    const { props } = createProps();
    const { result } = renderViewModel(props);

    act(() => result.current.pickDepositAccount());
    selectFundingAccount();
    typeAmount(result.current.pressAmountKey, "20");

    expect(result.current.exceedsBalance).toBe(false);
    expect(result.current.statusError).toBeNull();
    expect(result.current.maxAmount).toBe(0);

    expect(result.current.canReview).toBe(false);
    expect(quotedAmount()).toBe("");
  });

  it("enables the review CTA once a funding account and amount are set", () => {
    const { props } = createProps();
    const { result } = renderViewModel(props);

    act(() => result.current.pickDepositAccount());
    selectFundingAccount();
    typeAmount(result.current.pressAmountKey, "20");

    expect(result.current.canReview).toBe(true);
  });

  it("quotes the typed amount converted into the funding currency", () => {
    // $20 buys 0.025 ETH, which the provider expects in display units.
    mockCalculate.mockReturnValue(2.5e16);
    const { props } = createProps();
    const { result } = renderViewModel(props);

    act(() => result.current.pickDepositAccount());
    selectFundingAccount(fundedAccount);
    typeAmount(result.current.pressAmountKey, "20");

    expect(quotedAmount()).toBe("0.025");
  });

  it("quotes no more than the funding account can spend", () => {
    // The rate prices the amount above the balance, which caps what we can send.
    mockCalculate.mockReturnValue(2.5e16);
    const { props } = createProps();
    const { result } = renderViewModel(props);

    act(() => result.current.pickDepositAccount());
    selectFundingAccount();
    typeAmount(result.current.pressAmountKey, "20");

    expect(result.current.statusError).toBeNull();
    expect(quotedAmount()).toBe(new BigNumber(10000).shiftedBy(-18).toFixed());
  });

  it("floors a quote that lands between two atomic units", () => {
    mockCalculate.mockReturnValue(1.6);
    const { props } = createProps();
    const { result } = renderViewModel(props);

    act(() => result.current.pickDepositAccount());
    selectFundingAccount();
    typeAmount(result.current.pressAmountKey, "20");

    // Rounding up would price the deposit above what the user typed, so the
    // conversion stays fractional and only the floor below rounds it.
    expect(mockCalculate).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ reverse: true, disableRounding: true }),
    );
    expect(quotedAmount()).toBe(new BigNumber(1).shiftedBy(-18).toFixed());
  });

  it("hides both balances when discreet mode is on", () => {
    const { props } = createProps();
    const { result } = renderViewModel(props, true);

    act(() => result.current.pickDepositAccount());
    selectFundingAccount();

    expect(result.current.headerDescription).toContain("***");
    expect(result.current.depositAccountCounterValue).toBe("***");
  });

  it("holds the review CTA back until the quote lands", () => {
    mockUsePerpsDepositQuote.mockReturnValue({
      quote: undefined,
      isLoading: true,
      isUnavailable: false,
    });
    const { props } = createProps();
    const { result } = renderViewModel(props);

    act(() => result.current.pickDepositAccount());
    selectFundingAccount();
    typeAmount(result.current.pressAmountKey, "20");

    // The form itself is valid, so only the missing quote keeps the CTA disabled.
    expect(result.current.statusError).toBeNull();
    expect(result.current.canReview).toBe(false);
    expect(result.current.isQuoteLoading).toBe(true);
    expect(result.current.formattedQuotedAmount).toBe("");
  });

  it("stops shimmering and explains itself when the provider has no quote", () => {
    mockUsePerpsDepositQuote.mockReturnValue({
      quote: undefined,
      isLoading: false,
      isUnavailable: true,
    });
    const { props } = createProps();
    const { result } = renderViewModel(props);

    act(() => result.current.pickDepositAccount());
    selectFundingAccount();
    typeAmount(result.current.pressAmountKey, "20");

    // A pair the provider cannot route is an answer, not a pending request.
    expect(result.current.isQuoteLoading).toBe(false);
    expect(result.current.canReview).toBe(false);
    expect(result.current.statusError).toEqual({
      labelKey: "perpsDeposit.formErrors.quoteUnavailable",
    });
  });

  it("blames the balance rather than the provider when both are wrong", () => {
    mockUsePerpsDepositQuote.mockReturnValue({
      quote: undefined,
      isLoading: false,
      isUnavailable: true,
    });
    const { props } = createProps();
    const { result } = renderViewModel(props);

    act(() => result.current.pickDepositAccount());
    selectFundingAccount();
    typeAmount(result.current.pressAmountKey, "150");

    expect(result.current.statusError).toEqual({
      labelKey: "perpsDeposit.formErrors.amountExceedsBalance",
    });
  });

  it("opens the review with the amount converted into the funding currency", () => {
    // $20 buys 0.025 ETH, which the review shows in the funding currency.
    mockCalculate.mockReturnValue(2.5e16);
    const { props } = createProps();
    const { result } = renderViewModel(props);

    act(() => result.current.pickDepositAccount());
    selectFundingAccount(fundedAccount);
    typeAmount(result.current.pressAmountKey, "20");

    act(() => result.current.handleReview());

    expect(result.current.isReviewOpen).toBe(true);
    expect(result.current.reviewParams).toEqual({
      depositAccount: fundedAccount,
      receiverAccount,
      amountSent: "0.025",
      amountTo: "42",
      quoteId: "quote-1",
    });
  });

  it("holds the reviewed amounts still while quotes refresh behind it", () => {
    mockCalculate.mockReturnValue(2.5e16);
    const { props } = createProps();
    const { result, rerender } = renderViewModel(props);

    act(() => result.current.pickDepositAccount());
    selectFundingAccount(fundedAccount);
    typeAmount(result.current.pressAmountKey, "20");
    act(() => result.current.handleReview());

    const reviewed = result.current.reviewParams;

    mockUsePerpsDepositQuote.mockReturnValue({
      quote: undefined,
      isLoading: true,
      isUnavailable: false,
    });
    act(() => rerender(undefined));

    expect(result.current.isReviewOpen).toBe(true);
    expect(result.current.reviewParams).toEqual(reviewed);
  });

  it("keeps the review closed while the form is incomplete", () => {
    const { props } = createProps();
    const { result } = renderViewModel(props);

    typeAmount(result.current.pressAmountKey, "20");
    act(() => result.current.handleReview());

    expect(result.current.isReviewOpen).toBe(false);
    expect(result.current.reviewParams).toBeNull();
  });
});
