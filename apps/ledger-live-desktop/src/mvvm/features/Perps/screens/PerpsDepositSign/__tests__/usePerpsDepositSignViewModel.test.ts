import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { renderHook } from "tests/testSetup";
import type { PerpsDepositExecutionCallbacks } from "LLD/features/Perps/hooks/usePerpsDepositExecution";
import {
  usePerpsDepositSignViewModel,
  type PerpsDepositSignData,
} from "../usePerpsDepositSignViewModel";

const mockOpenPerpsReview = jest.fn();
jest.mock("../../PerpsReview/PerpsReviewDialog", () => ({
  openPerpsReview: (data: unknown) => mockOpenPerpsReview(data),
}));

let capturedCallbacks: PerpsDepositExecutionCallbacks | undefined;
const mockExecuteDeposit = jest.fn();
jest.mock("LLD/features/Perps/hooks/usePerpsDepositExecution", () => ({
  usePerpsDepositExecution: (_params: unknown, callbacks: PerpsDepositExecutionCallbacks) => {
    capturedCallbacks = callbacks;
    return {
      deviceStep: { kind: "processing" },
      executeDeposit: mockExecuteDeposit,
      retry: jest.fn(),
    };
  },
}));

const ethereum = getCryptoCurrencyById("ethereum");
const depositAccount = genAccount("funding-1", { currency: ethereum, operationsSize: 0 });
const receiverAccount = genAccount("receiver-1", { currency: ethereum, operationsSize: 0 });

const data: PerpsDepositSignData = {
  depositAccount,
  receiverAccount,
  amountSent: "0.02",
  amountTo: "0.019",
  quoteId: "quote-1",
  draft: { depositAccount, depositAmount: 20 },
};

describe("usePerpsDepositSignViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedCallbacks = undefined;
  });

  it("should start the deposit as soon as the dialog opens", () => {
    renderHook(() => usePerpsDepositSignViewModel(data, jest.fn()));

    expect(mockExecuteDeposit).toHaveBeenCalledTimes(1);
  });

  it("should reopen the review, draft and all, when the deposit is declined on the device", () => {
    const onClose = jest.fn();
    renderHook(() => usePerpsDepositSignViewModel(data, onClose));

    capturedCallbacks?.onRefused();

    // The summary comes back exactly as it was left, so the amount survives the decline.
    expect(mockOpenPerpsReview).toHaveBeenCalledWith(data);
    expect(onClose).toHaveBeenCalled();
  });

  it("should reopen the review when the manager prompt is declined, which fails the connection", () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => usePerpsDepositSignViewModel(data, onClose));

    result.current.onDeviceError(
      Object.assign(new Error("refused"), { name: "UserRefusedAllowManager" }),
    );

    expect(mockOpenPerpsReview).toHaveBeenCalledWith(data);
    expect(onClose).toHaveBeenCalled();
  });

  it("should leave a connection failure to the device action, which retries in place", () => {
    const onClose = jest.fn();
    const { result } = renderHook(() => usePerpsDepositSignViewModel(data, onClose));

    result.current.onDeviceError(new Error("device is locked"));

    expect(mockOpenPerpsReview).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should close without reopening the review once the deposit goes through", () => {
    const onClose = jest.fn();
    renderHook(() => usePerpsDepositSignViewModel(data, onClose));

    capturedCallbacks?.onDone();

    expect(onClose).toHaveBeenCalled();
    expect(mockOpenPerpsReview).not.toHaveBeenCalled();
  });
});
