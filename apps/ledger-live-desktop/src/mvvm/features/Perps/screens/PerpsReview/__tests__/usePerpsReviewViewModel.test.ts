import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { AccountLike } from "@ledgerhq/types-live";
import { renderHook, waitFor } from "tests/testSetup";
import { usePerpsReviewViewModel, type PerpsReviewData } from "../usePerpsReviewViewModel";

const mockOpenPerpsDeposit = jest.fn();
jest.mock("../../PerpsDeposit/PerpsDepositDialog", () => ({
  openPerpsDeposit: (data: unknown) => mockOpenPerpsDeposit(data),
}));

const mockOpenPerpsDepositSign = jest.fn();
jest.mock("../../PerpsDepositSign/PerpsDepositSignDialog", () => ({
  openPerpsDepositSign: (data: unknown) => mockOpenPerpsDepositSign(data),
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

  it("should show no received amount rather than echo the sent one when unquoted", async () => {
    const { result } = renderHook(() => usePerpsReviewViewModel(createData(), jest.fn()));

    await waitFor(() => expect(result.current.swapDetails[0].value).not.toBe(""));
    expect(result.current.swapDetails[1].value).toBe("");
  });

  it("should show the received amount and the receiver account in the deposit details", async () => {
    const { result } = renderHook(() =>
      usePerpsReviewViewModel(
        createData({ amountTo: { value: "0.019", currencyId: "ethereum" } }),
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

  it("should hand the signing dialog the quote the review priced against", () => {
    const onClose = jest.fn();
    const data = createData({
      amountTo: { value: "0.019", currencyId: "ethereum" },
      quoteId: "quote-1",
      draft: { depositAccount, depositAmount: 20 },
    });
    const { result } = renderHook(() => usePerpsReviewViewModel(data, onClose));

    result.current.handleDeposit();

    expect(mockOpenPerpsDepositSign).toHaveBeenCalledWith({
      depositAccount,
      receiverAccount,
      amountSent: data.amountSent,
      amountTo: data.amountTo,
      quoteId: "quote-1",
    });
    expect(onClose).toHaveBeenCalled();
    expect(mockOpenPerpsDeposit).not.toHaveBeenCalled();
  });
});
