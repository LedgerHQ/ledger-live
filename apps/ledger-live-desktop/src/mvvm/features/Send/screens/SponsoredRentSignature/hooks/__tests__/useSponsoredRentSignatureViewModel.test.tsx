import { renderHook, act } from "tests/testSetup";
import logger from "~/renderer/logger";
import {
  useSponsoredRentSignatureViewModel,
  type SponsoredRentSignatureResult,
} from "../useSponsoredRentSignatureViewModel";
import type { RentPayment } from "@ledgerhq/live-common/bridge/generic-coin-framework/sponsored";
import { TRON_USDT_FEE_ASSET } from "../../../Recipient/__integrations__/__fixtures__/accounts";

const mockAccount = { id: "acc_tron", type: "Account", currency: { id: "tron" } };

const mockClose = jest.fn();
jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: () => ({
    state: { account: { account: mockAccount, parentAccount: null } },
  }),
  useSendFlowActions: () => ({ close: mockClose }),
}));

const mockCraftRent = jest.fn(() => Promise.resolve());
const mockStartRentPayment = jest.fn(() => Promise.resolve());
const mockSetContractDataFailure = jest.fn();
const mockActions = {
  craftRent: mockCraftRent,
  startRentPayment: mockStartRentPayment,
  setContractDataFailure: mockSetContractDataFailure,
  onTransferSuccess: jest.fn(),
  onTransferError: jest.fn(),
  retry: jest.fn(),
  reset: jest.fn(),
};

let mockSponsoredState: {
  phase: string;
  order: { orderId: string; transaction: unknown; payCoinCode: string; payCoinAmt: string } | null;
  toSign: string | null;
  paymentTxId: string | null;
  rentPayment: RentPayment | null;
  failureKind: string | null;
  failureError: Error | null;
};

jest.mock("../../../../context/SponsoredSendContext", () => ({
  useSponsoredSend: () => ({
    state: mockSponsoredState,
    actions: mockActions,
    providerName: "Provider",
  }),
}));

jest.mock("~/renderer/hooks/useConnectAppAction", () => ({
  useRawTransactionAction: () => ({ fakeAction: true }),
}));

const rawDataHex = "0a02abcd";
const orderTransaction = {
  visible: true,
  txID: "tx-a-id",
  raw_data: {},
  raw_data_hex: rawDataHex,
};

function makeOrder() {
  return {
    orderId: "order-1",
    transaction: orderTransaction,
    payCoinCode: "USDT",
    payCoinAmt: "1.5",
  };
}

describe("useSponsoredRentSignatureViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(logger, "critical").mockImplementation(() => {});
    mockSponsoredState = {
      phase: "RENT_SIGNING",
      order: null,
      toSign: null,
      paymentTxId: null,
      rentPayment: null,
      failureKind: null,
      failureError: null,
    };
  });

  it("crafts the order on entry exactly once when phase is RENT_SIGNING and there is no order yet", () => {
    renderHook(() => useSponsoredRentSignatureViewModel());

    expect(mockCraftRent).toHaveBeenCalledTimes(1);
  });

  it("crafts the order on entry exactly once when phase is IDLE and there is no order yet (AMOUNT navigated in without craftRent)", () => {
    mockSponsoredState.phase = "IDLE";

    renderHook(() => useSponsoredRentSignatureViewModel());

    expect(mockCraftRent).toHaveBeenCalledTimes(1);
  });

  it("does not craft while an order is already present", () => {
    mockSponsoredState.order = makeOrder();

    renderHook(() => useSponsoredRentSignatureViewModel());

    expect(mockCraftRent).not.toHaveBeenCalled();
  });

  it("hands the raw combined device signature to startRentPayment (family seam rebuilds the payload)", () => {
    mockSponsoredState.order = makeOrder();
    mockSponsoredState.toSign = rawDataHex;
    mockSponsoredState.paymentTxId = "tx-a-id";
    const { result } = renderHook(() => useSponsoredRentSignatureViewModel());

    const combinedSignature = "0008" + rawDataHex + "SIGHEX";
    act(() => {
      result.current.onResult({
        signedOperation: { signature: combinedSignature },
        device: {},
      } as unknown as SponsoredRentSignatureResult);
    });

    expect(mockStartRentPayment).toHaveBeenCalledTimes(1);
    expect(mockStartRentPayment).toHaveBeenCalledWith(combinedSignature, "tx-a-id");
  });

  it("routes a contract-data-disabled refusal to setContractDataFailure and never starts the rent payment", () => {
    mockSponsoredState.order = makeOrder();
    mockSponsoredState.toSign = rawDataHex;
    mockSponsoredState.paymentTxId = "tx-a-id";
    const { result } = renderHook(() => useSponsoredRentSignatureViewModel());

    const contractDataError = Object.assign(new Error("contract data disabled"), {
      name: "TransportStatusError",
      statusCode: 0x6a80,
    });

    act(() => {
      result.current.onResult({ transactionSignError: contractDataError });
    });

    expect(mockSetContractDataFailure).toHaveBeenCalledTimes(1);
    expect(mockSetContractDataFailure).toHaveBeenCalledWith(contractDataError, "tx-a-id");
    expect(mockStartRentPayment).not.toHaveBeenCalled();
  });

  it("surfaces any other sign error for a retry (no contract-data failure, no rent payment)", () => {
    mockSponsoredState.order = makeOrder();
    const { result } = renderHook(() => useSponsoredRentSignatureViewModel());

    const refusedOnDevice = Object.assign(new Error("refused"), {
      name: "TransactionRefusedOnDevice",
    });

    act(() => {
      result.current.onResult({ transactionSignError: refusedOnDevice });
    });

    expect(result.current.signError).toBe(refusedOnDevice);
    expect(mockSetContractDataFailure).not.toHaveBeenCalled();
    expect(mockStartRentPayment).not.toHaveBeenCalled();

    act(() => {
      result.current.onRetrySign();
    });

    expect(result.current.signError).toBeNull();
  });

  it("offers a Cancel next to Retry that closes the flow", () => {
    mockSponsoredState.order = makeOrder();
    const { result } = renderHook(() => useSponsoredRentSignatureViewModel());

    act(() => {
      result.current.onResult({
        transactionSignError: Object.assign(new Error("refused"), {
          name: "TransactionRefusedOnDevice",
        }),
      });
    });
    result.current.onCancel();

    expect(result.current.cancelLabel).toBe("Cancel");
    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(mockActions.retry).not.toHaveBeenCalled();
  });

  it("does not report a refusal on the device to the logger", () => {
    mockSponsoredState.order = makeOrder();
    const { result } = renderHook(() => useSponsoredRentSignatureViewModel());

    act(() => {
      result.current.onResult({
        transactionSignError: Object.assign(new Error("refused"), {
          name: "TransactionRefusedOnDevice",
        }),
      });
    });

    expect(logger.critical).not.toHaveBeenCalled();
  });

  it("reports an unexpected sign error to the logger and still offers a retry", () => {
    mockSponsoredState.order = makeOrder();
    const { result } = renderHook(() => useSponsoredRentSignatureViewModel());
    const deviceError = Object.assign(new Error("device locked"), { name: "LockedDeviceError" });

    act(() => {
      result.current.onResult({ transactionSignError: deviceError });
    });

    expect(logger.critical).toHaveBeenCalledWith(deviceError);
    expect(result.current.signError).toBe(deviceError);
  });

  it("starts the rent payment once per order, and again for a re-crafted order", () => {
    mockSponsoredState.order = makeOrder();
    mockSponsoredState.toSign = rawDataHex;
    mockSponsoredState.paymentTxId = "tx-a-id";
    const { result, rerender } = renderHook(() => useSponsoredRentSignatureViewModel());
    const signed = {
      signedOperation: { signature: "0008" + rawDataHex + "SIGHEX" },
      device: {},
    } as unknown as SponsoredRentSignatureResult;

    act(() => {
      result.current.onResult(signed);
    });
    act(() => {
      result.current.onResult(signed);
    });
    expect(mockStartRentPayment).toHaveBeenCalledTimes(1);

    mockSponsoredState.order = makeOrder();
    rerender();
    act(() => {
      result.current.onResult(signed);
    });
    expect(mockStartRentPayment).toHaveBeenCalledTimes(2);
  });

  it("names the seam's provider in the strategy label", () => {
    const { result } = renderHook(() => useSponsoredRentSignatureViewModel());

    expect(result.current.strategyLabel).toBe("Energy rental - Provider");
  });

  it("shows the rent it will lock, in the payment asset's unit", () => {
    mockSponsoredState.order = makeOrder();
    mockSponsoredState.rentPayment = { asset: TRON_USDT_FEE_ASSET, amount: 1_500_000n };

    const { result } = renderHook(() => useSponsoredRentSignatureViewModel());

    expect(result.current.feeAmountLabel).toBe("1.5\u00a0USDT");
  });

  it("shows no rent before the order is crafted", () => {
    const { result } = renderHook(() => useSponsoredRentSignatureViewModel());

    expect(result.current.feeAmountLabel).toBeNull();
  });
});
