import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { AccountLike } from "@ledgerhq/types-live";
import { renderHook, waitFor } from "tests/testSetup";
import { usePerpsReviewViewModel, type PerpsReviewData } from "../usePerpsReviewViewModel";

const mockOpenPerpsDeposit = jest.fn();
jest.mock("../../PerpsDeposit/PerpsDepositDialog", () => ({
  openPerpsDeposit: (data: unknown) => mockOpenPerpsDeposit(data),
}));

function createAccount(id: string, currencyId: string): AccountLike {
  return {
    type: "Account",
    id,
    currency: getCryptoCurrencyById(currencyId),
    spendableBalance: new BigNumber(0),
    balance: new BigNumber(0),
  } as AccountLike;
}

const depositAccount = createAccount("funding-1", "ethereum");
const receiverAccount = createAccount("receiver-1", "ethereum");

function createData(overrides?: Partial<PerpsReviewData>): PerpsReviewData {
  return {
    depositAccount,
    receiverAccount,
    amountSent: { value: "0.02", currencyId: "ethereum" },
    ...overrides,
  };
}

describe("usePerpsReviewViewModel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should format the sent amount in the funding currency", async () => {
    const { result } = renderHook(() => usePerpsReviewViewModel(createData(), jest.fn()));

    await waitFor(() =>
      expect(result.current.swapDetails[0]).toEqual(
        expect.objectContaining({ labelKey: "perpsReview.amountSendLabel" }),
      ),
    );
    expect(result.current.swapDetails[0].value).toMatch(/^0\.02[\s\u00A0]ETH$/);
  });

  it("should fall back to the sent amount when no received amount is given", async () => {
    const { result } = renderHook(() => usePerpsReviewViewModel(createData(), jest.fn()));

    await waitFor(() => expect(result.current.swapDetails[1].value).not.toBe(""));
    expect(result.current.swapDetails[1].value).toBe(result.current.swapDetails[0].value);
  });

  it("should show the received amount and the receiver account in the deposit details", async () => {
    const { result } = renderHook(() =>
      usePerpsReviewViewModel(
        createData({ amountReceived: { value: "0.019", currencyId: "ethereum" } }),
        jest.fn(),
      ),
    );

    await waitFor(() => expect(result.current.depositDetails[0].value).not.toBe(""));
    expect(result.current.depositDetails[0].value).toMatch(/^0\.019[\s\u00A0]ETH$/);
    expect(result.current.depositDetails[1].testID).toBe("perps-deposit-receiver-account");
  });

  it("should reopen the deposit form with the draft when going back", () => {
    const onClose = jest.fn();
    const draft = { depositAccount, depositAmount: 20 };
    const { result } = renderHook(() => usePerpsReviewViewModel(createData({ draft }), onClose));

    result.current.handleBack();

    expect(mockOpenPerpsDeposit).toHaveBeenCalledWith({ receiverAccount, draft });
    expect(onClose).toHaveBeenCalled();
  });

  it("should close the review when confirming the deposit", () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => usePerpsReviewViewModel(createData(), onClose));

    result.current.handleDeposit();

    expect(onClose).toHaveBeenCalled();
    expect(mockOpenPerpsDeposit).not.toHaveBeenCalled();
  });
});
