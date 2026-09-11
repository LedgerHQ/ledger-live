import { renderHook, act } from "tests/testSetup";
import { SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import {
  useSponsoredRentSignatureViewModel,
  recoverDeviceSignature,
  type SponsoredRentSignatureResult,
} from "../useSponsoredRentSignatureViewModel";

const mockAccount = { id: "acc_tron", type: "Account", currency: { id: "tron" } };

const mockGoToStep = jest.fn();
jest.mock("LLD/features/FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: () => ({ navigation: { goToStep: mockGoToStep } }),
}));

jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowData: () => ({
    state: { account: { account: mockAccount, parentAccount: null } },
  }),
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
  paymentTxId: string | null;
  failureKind: string | null;
  failureError: Error | null;
};

jest.mock("../../../../context/SponsoredSendContext", () => ({
  useSponsoredSend: () => ({ state: mockSponsoredState, actions: mockActions }),
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

describe("recoverDeviceSignature", () => {
  it("strips the 4-hex-digit length prefix and the echoed raw_data_hex (coin-tron combine.ts format)", () => {
    const combined = "0008" + rawDataHex + "SIGHEX";
    expect(recoverDeviceSignature(rawDataHex, combined)).toBe("SIGHEX");
  });
});

describe("useSponsoredRentSignatureViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSponsoredState = {
      phase: "RENT_SIGNING",
      order: null,
      paymentTxId: null,
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

  it("rebuilds the Tronify-signed payload from the combined device signature and starts the rent payment", () => {
    mockSponsoredState.order = makeOrder();
    const { result } = renderHook(() => useSponsoredRentSignatureViewModel());

    const combinedSignature = "0008" + rawDataHex + "SIGHEX";
    act(() => {
      // Partial mocks: the view model only reads signedOperation.signature — a full
      // SignedOperation/Device would be noise, so cast the deliberately-minimal result.
      result.current.onResult({
        signedOperation: { signature: combinedSignature },
        device: {},
      } as unknown as SponsoredRentSignatureResult);
    });

    expect(mockStartRentPayment).toHaveBeenCalledTimes(1);
    expect(mockStartRentPayment).toHaveBeenCalledWith(
      { ...orderTransaction, signature: ["SIGHEX"] },
      "tx-a-id",
    );
  });

  it("routes a contract-data-disabled refusal to setContractDataFailure and never starts the rent payment", () => {
    mockSponsoredState.order = makeOrder();
    const { result } = renderHook(() => useSponsoredRentSignatureViewModel());

    const contractDataError = Object.assign(new Error("contract data disabled"), {
      name: "TransportStatusError",
      statusCode: 0x6a80,
    });

    act(() => {
      result.current.onResult({ transactionSignError: contractDataError });
    });

    expect(mockSetContractDataFailure).toHaveBeenCalledTimes(1);
    expect(mockSetContractDataFailure).toHaveBeenCalledWith(contractDataError);
    expect(mockStartRentPayment).not.toHaveBeenCalled();
  });

  it("leaves any other sign error to DeviceAction's own retry UI (no contract-data failure, no rent payment)", () => {
    mockSponsoredState.order = makeOrder();
    const { result } = renderHook(() => useSponsoredRentSignatureViewModel());

    const userRejectedError = Object.assign(new Error("user refused"), {
      name: "TransportStatusError",
      statusCode: 0x6985,
    });

    act(() => {
      result.current.onResult({ transactionSignError: userRejectedError });
    });

    expect(mockSetContractDataFailure).not.toHaveBeenCalled();
    expect(mockStartRentPayment).not.toHaveBeenCalled();
  });

  it("navigates to SPONSORED_POLLING when the phase transitions to POLLING", () => {
    mockSponsoredState.order = makeOrder();
    const { rerender } = renderHook(() => useSponsoredRentSignatureViewModel());

    mockSponsoredState = { ...mockSponsoredState, phase: "POLLING" };
    rerender();

    expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.SPONSORED_POLLING);
  });

  it("navigates to SPONSORED_FAILURE when the phase transitions to FAILED", () => {
    mockSponsoredState.order = makeOrder();
    const { rerender } = renderHook(() => useSponsoredRentSignatureViewModel());

    mockSponsoredState = { ...mockSponsoredState, phase: "FAILED", failureKind: "CONTRACT_DATA" };
    rerender();

    expect(mockGoToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.SPONSORED_FAILURE);
  });

  it("does not navigate while the phase stays RENT_SIGNING", () => {
    renderHook(() => useSponsoredRentSignatureViewModel());

    expect(mockGoToStep).not.toHaveBeenCalled();
  });
});
