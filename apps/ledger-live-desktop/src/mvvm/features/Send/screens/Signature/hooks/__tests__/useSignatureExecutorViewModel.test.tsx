import { act, renderHook, waitFor } from "tests/testSetup";
import { SEND_FLOW_COMPLETION, SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { reportSponsoredTransferOutcome } from "@ledgerhq/live-common/flows/send/sponsored/transferOutcome";
import { emitTransactionEvent } from "@ledgerhq/transaction-observability";
import { buildDeviceInitializationInput } from "LLD/components/DeviceIntentExecutor";
import { useSignatureExecutorViewModel } from "../useSignatureExecutorViewModel";
import { useSendSignatureSession } from "../useSendSignatureSession";

jest.mock("../useSendSignatureSession");
jest.mock("@ledgerhq/live-common/flows/send/sponsored/transferOutcome");
jest.mock("@ledgerhq/transaction-observability", () => ({
  ...jest.requireActual("@ledgerhq/transaction-observability"),
  emitTransactionEvent: jest.fn(),
}));
jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
}));

const mockNavigation = { resetToStep: jest.fn() };
let mockStepHistory: string[] = [SEND_FLOW_STEP.RECIPIENT, SEND_FLOW_STEP.AMOUNT];
jest.mock("../../../../../FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: () => ({ navigation: mockNavigation, stepHistory: mockStepHistory }),
}));

const ACCOUNT = {
  id: "acc",
  type: "Account",
  currency: { id: "ethereum", family: "evm", ticker: "ETH" },
};
const REQUEST = { account: ACCOUNT, parentAccount: null, transaction: { family: "evm" } };
const INIT_INPUT = { appRequest: { appName: "Ethereum" } };

const session = {
  account: ACCOUNT,
  transaction: REQUEST.transaction,
  request: REQUEST,
  isSponsoredTransfer: false,
  sponsoredActions: { onTransferSuccess: jest.fn(), onTransferError: jest.fn() },
  signedPaymentTxId: "payment-tx",
  onDeviceActionResult: jest.fn(),
  finishWithError: jest.fn(),
  trackSignatureMessage: jest.fn(),
  onDeviceConfirmationShown: jest.fn(),
};

const SIGNED_OPERATION = { operation: { id: "op" } } as never;
const DEVICE_MODEL_ID = "stax" as never;
const DISCONNECTED = { type: "deviceDisconnected", device: {} } as never;

type ViewModel = ReturnType<typeof useSignatureExecutorViewModel>;

const reportSignedOperation = (viewModel: ViewModel) => {
  act(() => viewModel.signatureIntent?.onResult?.(SIGNED_OPERATION));
};

const mockSession = (overrides: Partial<typeof session> = {}) => {
  jest
    .mocked(useSendSignatureSession)
    .mockReturnValue({ ...session, ...overrides } as unknown as ReturnType<
      typeof useSendSignatureSession
    >);
};

describe("useSignatureExecutorViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStepHistory = [SEND_FLOW_STEP.RECIPIENT, SEND_FLOW_STEP.AMOUNT];
    jest.mocked(buildDeviceInitializationInput).mockResolvedValue(INIT_INPUT as never);
    mockSession();
  });

  it("builds the executor input for the send flow and an intent from the request", async () => {
    const { result } = renderHook(() => useSignatureExecutorViewModel());

    await waitFor(() => expect(result.current.deviceInitializationInput).toBe(INIT_INPUT));
    expect(buildDeviceInitializationInput).toHaveBeenCalledWith({
      appRequest: { account: ACCOUNT, tokenCurrency: undefined },
      flow: "send",
    });
    expect(result.current.signatureIntent?.input).toBe(REQUEST);
  });

  it("ends the flow with the error when the executor input cannot be built", async () => {
    const error = new Error("init failed");
    jest.mocked(buildDeviceInitializationInput).mockRejectedValue(error);

    renderHook(() => useSignatureExecutorViewModel());

    await waitFor(() => expect(session.finishWithError).toHaveBeenCalledWith(error));
  });

  it("hands the signed operation to the signature core once the job completes", () => {
    const { result } = renderHook(() => useSignatureExecutorViewModel());

    reportSignedOperation(result.current);
    expect(session.onDeviceActionResult).not.toHaveBeenCalled();
    expect(result.current.isSigned).toBe(false);

    act(() => result.current.onIntentJobComplete());

    expect(session.onDeviceActionResult).toHaveBeenCalledWith({
      signedOperation: SIGNED_OPERATION,
      device: {},
    });
    expect(result.current.isSigned).toBe(true);
  });

  it("does not broadcast when the job completes without a signed operation", () => {
    const { result } = renderHook(() => useSignatureExecutorViewModel());

    act(() => result.current.onIntentJobComplete());

    expect(session.onDeviceActionResult).not.toHaveBeenCalled();
    expect(result.current.isSigned).toBe(false);
  });

  it("pins the transaction for the whole signature session", () => {
    renderHook(() => useSignatureExecutorViewModel());

    expect(useSendSignatureSession).toHaveBeenCalledWith({ pinTransaction: true });
  });

  it("broadcasts only once when the job reports and completes twice", () => {
    const { result } = renderHook(() => useSignatureExecutorViewModel());

    reportSignedOperation(result.current);
    act(() => result.current.onIntentJobComplete());
    reportSignedOperation(result.current);
    act(() => result.current.onIntentJobComplete());

    expect(session.onDeviceActionResult).toHaveBeenCalledTimes(1);
    expect(result.current.isSigned).toBe(true);
  });

  it("goes back to the step before signature when the user closes the executor", () => {
    const { result } = renderHook(() => useSignatureExecutorViewModel());

    act(() => result.current.onUserCancel());

    expect(mockNavigation.resetToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.AMOUNT);
  });

  it("ignores a close once the broadcast has started", () => {
    const { result } = renderHook(() => useSignatureExecutorViewModel());

    reportSignedOperation(result.current);
    act(() => result.current.onIntentJobComplete());
    act(() => result.current.onUserCancel());

    expect(mockNavigation.resetToStep).not.toHaveBeenCalled();
  });

  it("reports a failed sponsored transfer instead of going back when the user closes", () => {
    mockSession({ isSponsoredTransfer: true });
    const { result } = renderHook(() => useSignatureExecutorViewModel());

    act(() => result.current.onUserCancel());

    expect(mockNavigation.resetToStep).not.toHaveBeenCalled();
    expect(reportSponsoredTransferOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        actions: session.sponsoredActions,
        signedPaymentTxId: "payment-tx",
        completion: SEND_FLOW_COMPLETION.FAILURE,
      }),
    );
  });

  it("tracks signing failures but not user refusals", () => {
    const { result } = renderHook(() => useSignatureExecutorViewModel());
    const error = Object.assign(new Error("failed"), { name: "TransportStatusError" });

    act(() => result.current.onIntentJobStateChanged({ type: "cancelled", retry: jest.fn() }));
    act(() => result.current.onIntentJobStateChanged({ type: "error", error, retry: jest.fn() }));

    expect(session.trackSignatureMessage).toHaveBeenCalledTimes(1);
    expect(session.trackSignatureMessage).toHaveBeenCalledWith("TransportStatusError");
  });

  it("reports a device interruption, not an abandonment, when the device disconnects", () => {
    const { result, unmount } = renderHook(() => useSignatureExecutorViewModel());

    act(() =>
      result.current.onIntentJobStateChanged({ type: "pending", deviceModelId: DEVICE_MODEL_ID }),
    );
    act(() => result.current.onExecutorStateChanged(DISCONNECTED));
    unmount();

    expect(emitTransactionEvent).toHaveBeenCalledTimes(1);
    expect(emitTransactionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failure",
        stage: "sign",
        operationalOnly: true,
        error: expect.objectContaining({ name: "DisconnectedDeviceDuringOperation" }),
      }),
    );
  });

  it("reports an abandonment when the user leaves an unsettled signature", () => {
    const { result, unmount } = renderHook(() => useSignatureExecutorViewModel());

    act(() =>
      result.current.onIntentJobStateChanged({ type: "pending", deviceModelId: DEVICE_MODEL_ID }),
    );
    unmount();

    expect(emitTransactionEvent).toHaveBeenCalledTimes(1);
  });

  it("reports nothing once the signature is settled", () => {
    const { result, unmount } = renderHook(() => useSignatureExecutorViewModel());

    act(() =>
      result.current.onIntentJobStateChanged({ type: "pending", deviceModelId: DEVICE_MODEL_ID }),
    );
    act(() =>
      result.current.onIntentJobStateChanged({ type: "signed", signedOperation: SIGNED_OPERATION }),
    );
    unmount();

    expect(emitTransactionEvent).not.toHaveBeenCalled();
  });

  it("broadcasts the signature in hand when the device disconnects before the job completes", () => {
    const { result } = renderHook(() => useSignatureExecutorViewModel());

    reportSignedOperation(result.current);
    act(() => result.current.onExecutorStateChanged(DISCONNECTED));

    expect(session.onDeviceActionResult).toHaveBeenCalledTimes(1);
    expect(result.current.isSigned).toBe(true);
  });

  it("still lets the user close when a signed result has not been broadcast", () => {
    const { result } = renderHook(() => useSignatureExecutorViewModel());

    reportSignedOperation(result.current);
    act(() => result.current.onUserCancel());

    expect(mockNavigation.resetToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.AMOUNT);
  });

  it("keeps the first request when a sync rebuilds it", async () => {
    const { result, rerender } = renderHook(() => useSignatureExecutorViewModel());
    await waitFor(() => expect(result.current.deviceInitializationInput).toBe(INIT_INPUT));

    mockSession({ request: { ...REQUEST, transaction: { family: "evm", nonce: 2 } } as never });
    rerender();

    expect(result.current.request).toBe(REQUEST);
    expect(buildDeviceInitializationInput).toHaveBeenCalledTimes(1);
  });
});
