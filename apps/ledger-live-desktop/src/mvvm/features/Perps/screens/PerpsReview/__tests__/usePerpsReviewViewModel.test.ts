import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
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

const ethereum = getCryptoCurrencyById("ethereum");
const depositAccount = genAccount("funding-1", { currency: ethereum, operationsSize: 0 });
const receiverAccount = genAccount("receiver-1", { currency: ethereum, operationsSize: 0 });

function createData(overrides?: Partial<PerpsReviewData>): PerpsReviewData {
  return {
    depositAccount,
    receiverAccount,
    amountSent: "0.02",
    amountTo: "0.019",
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

  it("should read the amount in the unit it was handed over in", async () => {
    const gwei = ethereum.units[1];
    const { result } = renderHook(() => usePerpsReviewViewModel(createData(), jest.fn()), {
      initialState: { settings: { currenciesSettings: { ETH: { unit: gwei } } } },
    });

    await waitFor(() => expect(result.current.swapDetails[0].value).not.toBe(""));
    expect(result.current.swapDetails[0].value).toMatch(/^0\.02[\s\u00A0]ETH$/);
  });

  it("should format the received amount in the receiving currency, as an estimate", async () => {
    const { result } = renderHook(() => usePerpsReviewViewModel(createData(), jest.fn()));

    await waitFor(() => expect(result.current.swapDetails[1].value).not.toBe(""));
    expect(result.current.swapDetails[1].value).toMatch(/^~0\.019[\s\u00A0]ETH$/);
  });

  it("should show the received amount and the receiver account in the deposit details", async () => {
    const { result } = renderHook(() => usePerpsReviewViewModel(createData(), jest.fn()));

    await waitFor(() => expect(result.current.depositDetails[0].value).not.toBe(""));
    expect(result.current.depositDetails[0].value).toMatch(/^~0\.019[\s\u00A0]ETH$/);
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

  it("should hand the signing dialog the quote the review priced against, and the draft behind it", () => {
    const onClose = jest.fn();
    const draft = { depositAccount, depositAmount: 20 };
    const data = createData({ quoteId: "quote-1", draft });
    const { result } = renderHook(() => usePerpsReviewViewModel(data, onClose));

    result.current.handleDeposit();

    // The draft travels with the quote so a decline on the device can come back here.
    expect(mockOpenPerpsDepositSign).toHaveBeenCalledWith({
      depositAccount,
      receiverAccount,
      amountSent: data.amountSent,
      amountTo: data.amountTo,
      quoteId: "quote-1",
      draft,
    });
    expect(onClose).toHaveBeenCalled();
    expect(mockOpenPerpsDeposit).not.toHaveBeenCalled();
  });
});
