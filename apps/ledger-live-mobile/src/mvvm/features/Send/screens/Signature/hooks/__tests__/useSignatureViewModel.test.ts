import { act, renderHook } from "@testing-library/react-native";
import {
  SPONSORED_PHASE,
  type SponsoredPhase,
} from "@ledgerhq/live-common/flows/send/sponsored/types";
import { SEND_FLOW_COMPLETION } from "@ledgerhq/live-common/flows/send/types";
import { useSendFlowSignatureCore } from "@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore";
import { useSignatureViewModel } from "../useSignatureViewModel";

const mockFinishSigning = jest.fn();
const mockStopSigning = jest.fn();
const mockSponsoredActions = {
  onTransferSuccess: jest.fn(),
  onTransferError: jest.fn(),
};
let mockSponsoredState: { phase: SponsoredPhase; paymentTxId: string | null };

jest.mock("@ledgerhq/live-common/flows/send/hooks/useSendFlowSignatureCore", () => ({
  useSendFlowSignatureCore: jest.fn(() => ({
    request: null,
    finishWithError: jest.fn(),
    onDeviceActionResult: jest.fn(),
  })),
}));
jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: () => jest.fn(),
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
  useSendFlowActions: () => ({ operation: {}, status: {} }),
  useSendFlowData: () => ({
    state: { account: {}, transaction: { transaction: null, status: null }, recipient: null },
  }),
}));
jest.mock("../../../../context/SendSignatureContext", () => ({
  useSendSignature: () => ({ finishSigning: mockFinishSigning, stopSigning: mockStopSigning }),
}));
jest.mock("../../../../context/SponsoredSendContext", () => ({
  useSponsoredSend: () => ({ state: mockSponsoredState, actions: mockSponsoredActions }),
}));
jest.mock("../useSignatureTracking", () => ({
  useSignatureTracking: () => ({
    trackDeviceConfirmation: jest.fn(),
    trackSignatureError: jest.fn(),
  }),
}));

const signError = Object.assign(new Error("refused"), {
  name: "TransportStatusError",
  statusCode: 0x6a80,
});

/** The onFinish the view model hands the shared signature core on its latest render. */
const lastOnFinish = () => jest.mocked(useSendFlowSignatureCore).mock.calls.at(-1)?.[0].onFinish;

beforeEach(() => {
  jest.clearAllMocks();
  mockSponsoredState = { phase: SPONSORED_PHASE.TRANSFER, paymentTxId: "txA" };
});

describe("useSignatureViewModel in a sponsored transfer", () => {
  it("reports a broadcast TX-C to the orchestration before moving on", () => {
    renderHook(() => useSignatureViewModel());

    act(() => lastOnFinish()?.(SEND_FLOW_COMPLETION.SUCCESS));

    expect(mockSponsoredActions.onTransferSuccess).toHaveBeenCalledWith("txA");
    expect(mockFinishSigning).toHaveBeenCalled();
  });

  it("keeps the payment id it mounted with, so a later outcome can be dropped as stale", () => {
    const { rerender } = renderHook(() => useSignatureViewModel());
    mockSponsoredState = { phase: SPONSORED_PHASE.TRANSFER, paymentTxId: "txB" };
    rerender({});

    act(() => lastOnFinish()?.(SEND_FLOW_COMPLETION.SUCCESS));

    expect(mockSponsoredActions.onTransferSuccess).toHaveBeenCalledWith("txA");
  });

  it("routes a failed TX-C to the sponsored failure screen instead of moving on", () => {
    renderHook(() => useSignatureViewModel());
    const error = new Error("broadcast failed");

    act(() => lastOnFinish()?.(SEND_FLOW_COMPLETION.FAILURE, error));

    expect(mockSponsoredActions.onTransferError).toHaveBeenCalledWith(error, "txA");
    expect(mockFinishSigning).not.toHaveBeenCalled();
  });

  it("leaves a sign error on the executor's screen without failing the sponsored flow", () => {
    const { result } = renderHook(() => useSignatureViewModel());

    act(() => result.current.onIntentJobError(signError));
    act(() => result.current.onUserCancel());

    expect(mockSponsoredActions.onTransferError).not.toHaveBeenCalled();
    expect(mockStopSigning).toHaveBeenCalled();
  });

  // The sheet calls onUserCancel when it unmounts; the failure screen's Retry reopens TX-C.
  it("keeps signing open once a failed TX-C is handed to the failure screen", () => {
    const { result } = renderHook(() => useSignatureViewModel());

    act(() => lastOnFinish()?.(SEND_FLOW_COMPLETION.FAILURE, new Error("init failed")));
    act(() => result.current.onUserCancel());

    expect(mockStopSigning).not.toHaveBeenCalled();
  });

  it("closes the overlay when the user dismisses the sheet", () => {
    const { result } = renderHook(() => useSignatureViewModel());

    act(() => result.current.onUserCancel());

    expect(mockStopSigning).toHaveBeenCalled();
  });
});

describe("useSignatureViewModel in a standard send", () => {
  beforeEach(() => {
    mockSponsoredState = { phase: SPONSORED_PHASE.IDLE, paymentTxId: null };
  });

  it("moves on without touching the orchestration, whatever the outcome", () => {
    const { result } = renderHook(() => useSignatureViewModel());

    act(() => lastOnFinish()?.(SEND_FLOW_COMPLETION.FAILURE, new Error("boom")));
    act(() => result.current.onIntentJobError(signError));

    expect(mockFinishSigning).toHaveBeenCalled();
    expect(mockSponsoredActions.onTransferError).not.toHaveBeenCalled();
  });
});
