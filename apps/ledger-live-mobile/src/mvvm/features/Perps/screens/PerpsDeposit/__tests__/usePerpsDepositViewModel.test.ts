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

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculateCountervalueCallback: () => (_currency: unknown, value: BigNumber) => value,
  useCountervaluesState: () => ({}),
}));

jest.mock("@ledgerhq/live-countervalues/logic", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues/logic"),
  calculate: () => 20000000000000000,
}));

const mockUsePerpsDepositQuote = jest.fn();
jest.mock("../usePerpsDepositQuote", () => ({
  usePerpsDepositQuote: () => mockUsePerpsDepositQuote(),
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
      accounts: { ...state.accounts, active: [fundingAccount] },
      settings: { ...state.settings, discreetMode },
    }),
  });
}

function selectFundingAccount() {
  const { onAccountSelected } = mockOpenDrawer.mock.calls[0][0];
  act(() => onAccountSelected(fundingAccount));
}

/** The keypad is the only way into the amount, so tests enter digits the same way. */
function typeAmount(pressAmountKey: (key: string) => void, amount: string) {
  act(() => [...amount].forEach(key => pressAmountKey(key)));
}

describe("usePerpsDepositViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsDepositQuote.mockReturnValue({
      quote: { amountTo: new BigNumber(42) },
      isLoading: false,
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
    expect(result.current.submitError).toBeNull();
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
    expect(result.current.submitError).toEqual({
      labelKey: "perpsDeposit.formErrors.amountExceedsBalance",
    });
    expect(result.current.canReview).toBe(false);
  });

  it("enables the review CTA once a funding account and amount are set", () => {
    const { props } = createProps();
    const { result } = renderViewModel(props);

    act(() => result.current.pickDepositAccount());
    selectFundingAccount();
    typeAmount(result.current.pressAmountKey, "20");

    expect(result.current.canReview).toBe(true);
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
    mockUsePerpsDepositQuote.mockReturnValue({ quote: undefined, isLoading: true });
    const { props } = createProps();
    const { result } = renderViewModel(props);

    act(() => result.current.pickDepositAccount());
    selectFundingAccount();
    typeAmount(result.current.pressAmountKey, "20");

    // The form itself is valid, so only the missing quote keeps the CTA disabled.
    expect(result.current.submitError).toBeNull();
    expect(result.current.canReview).toBe(false);
    expect(result.current.isQuoteLoading).toBe(true);
    expect(result.current.formattedDepositAmount).toBe("");
  });

  it("stops shimmering when the provider settles on no quote", () => {
    mockUsePerpsDepositQuote.mockReturnValue({ quote: undefined, isLoading: false });
    const { props } = createProps();
    const { result } = renderViewModel(props);

    act(() => result.current.pickDepositAccount());
    selectFundingAccount();
    typeAmount(result.current.pressAmountKey, "20");

    // A pair the provider cannot route is an answer, not a pending request.
    expect(result.current.isQuoteLoading).toBe(false);
    expect(result.current.canReview).toBe(false);
  });
});
