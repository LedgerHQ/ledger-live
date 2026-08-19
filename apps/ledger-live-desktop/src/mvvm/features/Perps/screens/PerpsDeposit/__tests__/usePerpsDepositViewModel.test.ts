import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { AccountLike } from "@ledgerhq/types-live";
import { act, renderHook } from "tests/testSetup";
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
jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculateCountervalueCallback: () => (_currency: unknown, value: BigNumber) => value,
  useCountervaluesState: () => ({}),
}));

jest.mock("@ledgerhq/live-countervalues/logic", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues/logic"),
  calculate: (_state: unknown, { value }: { value: number }) => value,
}));

const mockUsePerpsDepositQuote = jest.fn();
jest.mock("../usePerpsDepositQuote", () => ({
  usePerpsDepositQuote: () => mockUsePerpsDepositQuote(),
}));

function createAccount(id: string, currencyId: string, spendableBalance: number): AccountLike {
  return {
    type: "Account",
    id,
    currency: getCryptoCurrencyById(currencyId),
    spendableBalance: new BigNumber(spendableBalance),
    balance: new BigNumber(spendableBalance),
  } as AccountLike;
}

const receiverAccount = createAccount("receiver-1", "ethereum", 0);
const fundingAccount = createAccount("funding-1", "ethereum", 10000);

function renderViewModel(data: Partial<PerpsDepositData> = {}, onClose = jest.fn()) {
  // Kept stable: the view model resets the form whenever this object changes identity.
  const props: PerpsDepositData = { receiverAccount, ...data };
  const { result } = renderHook(() => usePerpsDepositViewModel(props, onClose));
  return { result, onClose };
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
    mockOpenAssetAndAccount.mockResolvedValue({ account: fundingAccount });
    mockUsePerpsDepositQuote.mockReturnValue({
      quote: { amountTo: new BigNumber(42) },
      isLoading: false,
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
    expect(result.current.submitError).toBeNull();
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
    expect(result.current.submitError).toEqual({
      labelKey: "perpsDeposit.formErrors.amountExceedsBalance",
    });
    expect(result.current.canReview).toBe(false);
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

  it("holds the review CTA back until the quote lands", async () => {
    mockUsePerpsDepositQuote.mockReturnValue({ quote: undefined, isLoading: true });
    const { result } = renderViewModel();

    await pickFundingAccount(result);
    act(() => result.current.changeDepositAmount("20"));

    // The form itself is valid, so only the missing quote keeps the CTA disabled.
    expect(result.current.submitError).toBeNull();
    expect(result.current.canReview).toBe(false);
    expect(result.current.isQuoteLoading).toBe(true);
    expect(result.current.formattedDepositAmount).toBe("");
  });

  it("stops shimmering when the provider settles on no quote", async () => {
    mockUsePerpsDepositQuote.mockReturnValue({ quote: undefined, isLoading: false });
    const { result } = renderViewModel();

    await pickFundingAccount(result);
    act(() => result.current.changeDepositAmount("20"));

    // A pair the provider cannot route is an answer, not a pending request.
    expect(result.current.isQuoteLoading).toBe(false);
    expect(result.current.canReview).toBe(false);
  });

  it("hands the review the amount converted into the funding currency", () => {
    const { result, onClose } = renderViewModel({
      draft: { depositAccount: fundingAccount, depositAmount: 20 },
    });

    act(() => result.current.handleReview());

    expect(mockOpenPerpsReview).toHaveBeenCalledWith({
      receiverAccount,
      depositAccount: fundingAccount,
      amountSent: "0.000000000000002",
      // The received side is whatever the provider quoted, not a local conversion.
      amountTo: "42",
      draft: { depositAccount: fundingAccount, depositAmount: 20 },
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
});
