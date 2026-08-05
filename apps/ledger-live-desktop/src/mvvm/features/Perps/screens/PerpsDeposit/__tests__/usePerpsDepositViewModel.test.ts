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

// Countervalues are priced 1:1 with the account balance so the form ceiling is
// predictable: a balance of 10_000 (2 decimals for USD) means a $100 maximum.
jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculateCountervalueCallback: () => (_currency: unknown, value: BigNumber) => value,
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
  });

  it("starts with an empty amount and no funding account", () => {
    const { result } = renderViewModel();

    expect(result.current.depositAmount).toBe(0);
    expect(result.current.depositAccountName).toBeNull();
    expect(result.current.depositCurrencyTicker).toBe("USDC");
    expect(result.current.canReview).toBe(false);
  });

  it("reports the minimum deposit error below the floor", () => {
    const { result } = renderViewModel();

    act(() => result.current.changeDepositAmount("3"));

    expect(result.current.depositAmount).toBe(3);
    expect(result.current.submitError).toEqual({
      isVisible: true,
      labelKey: "perpsDeposit.formErrors.minDeposit",
    });
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
      expect.objectContaining({ uiUseCase: "perpetuals:deposit" }),
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
      isVisible: true,
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

  it("closes the dialog when the form is ready to review", () => {
    const { result, onClose } = renderViewModel({
      draft: { depositAccount: fundingAccount, depositAmount: 20 },
    });

    act(() => result.current.handleReview());

    expect(onClose).toHaveBeenCalled();
  });
});
