import { act, renderHook, waitFor } from "@testing-library/react-native";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { isSendConfirmationRetryable } from "@ledgerhq/live-common/flows/send/presentBroadcastError";
import type { SignTransactionIntentJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import { useSignatureViewModel } from "../useSignatureViewModel";

const mockBroadcast = jest.fn();
const mockFinishSigning = jest.fn();
const mockOperation = {
  onSigned: jest.fn(),
  onTransactionError: jest.fn(),
  onOperationBroadcasted: jest.fn(),
};
const mockStatus = {
  resetStatus: jest.fn(),
  setError: jest.fn(),
  setSuccess: jest.fn(),
};
const mockAccount = {
  type: "Account",
  id: "ethereum-account",
  currency: { ticker: "ETH", name: "Ethereum" },
};

jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: () => mockBroadcast,
}));
jest.mock("@features/platform-device-intent", () => ({
  createIntent: jest.fn(),
}));
jest.mock("LLM/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
}));
jest.mock("~/datadog", () => ({ broadcastLogger: {} }));
jest.mock("~/context/hooks", () => ({
  useDispatch: () => jest.fn(),
  useSelector: () => false,
}));
jest.mock("../../intents/signTransactionIntent/intentLWMDefinition", () => ({
  signTransactionIntentLWMDefinition: {},
}));
jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowActions: () => ({ operation: mockOperation, status: mockStatus }),
  useSendFlowData: () => ({
    state: {
      account: { account: mockAccount, parentAccount: null, currency: null },
      transaction: { transaction: null, status: null },
      recipient: null,
    },
  }),
}));
jest.mock("../../../../context/SendSignatureContext", () => ({
  useSendSignature: () => ({ finishSigning: mockFinishSigning, stopSigning: jest.fn() }),
}));
jest.mock("../../../../context/SponsoredSendContext", () => ({
  useSponsoredSend: () => ({
    state: { phase: SPONSORED_PHASE.IDLE, paymentTxId: null },
    actions: {},
  }),
}));
jest.mock("../useSignatureTracking", () => ({
  useSignatureTracking: () => ({
    trackDeviceConfirmation: jest.fn(),
    trackSignatureError: jest.fn(),
  }),
}));

const signedJobState = {
  type: "signed",
  signedOperation: { signature: "sig", operation: {} },
} as unknown as SignTransactionIntentJobState;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useSignatureViewModel broadcast", () => {
  it("presents a node rejection after signing as a non-retryable broadcast error", async () => {
    mockBroadcast.mockRejectedValueOnce(
      Object.assign(new Error("node rejected transaction"), { name: "LedgerAPI4xx" }),
    );
    const { result } = renderHook(() => useSignatureViewModel());

    act(() => result.current.onIntentJobStateChanged(signedJobState));

    await waitFor(() => expect(mockOperation.onTransactionError).toHaveBeenCalledTimes(1));
    const error = mockOperation.onTransactionError.mock.calls[0][0];
    expect(mockOperation.onSigned).toHaveBeenCalledTimes(1);
    expect(error).toMatchObject({
      name: "TransactionBroadcastError",
      message: "node rejected transaction",
      coin: "ETH",
      networkName: "Ethereum",
    });
    expect(isSendConfirmationRetryable(error)).toBe(false);
    expect(mockFinishSigning).toHaveBeenCalledTimes(1);
  });

  it("keeps a serialized network rejection retryable", async () => {
    mockBroadcast.mockRejectedValueOnce({ name: "NetworkDown", message: "offline" });
    const { result } = renderHook(() => useSignatureViewModel());

    act(() => result.current.onIntentJobStateChanged(signedJobState));

    await waitFor(() => expect(mockOperation.onTransactionError).toHaveBeenCalledTimes(1));
    const error = mockOperation.onTransactionError.mock.calls[0][0];
    expect(error).toMatchObject({ name: "TransactionBroadcastError", message: "offline" });
    expect(isSendConfirmationRetryable(error)).toBe(true);
    expect(mockFinishSigning).toHaveBeenCalledTimes(1);
  });
});
