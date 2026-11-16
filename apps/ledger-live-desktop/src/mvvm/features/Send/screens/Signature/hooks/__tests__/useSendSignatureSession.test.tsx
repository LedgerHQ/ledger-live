import { act, renderHook, waitFor } from "tests/testSetup";
import { useSendSignatureSession } from "../useSendSignatureSession";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
  trackPage: jest.fn(),
}));

jest.mock("LLD/hooks/redux", () => ({
  ...jest.requireActual("LLD/hooks/redux"),
  useDispatch: () => jest.fn(),
}));

const mockNavigation = { goToNextStep: jest.fn(), goToStep: jest.fn() };
const mockOperation = {
  onTransactionError: jest.fn(),
  onOperationBroadcasted: jest.fn(),
  onSigned: jest.fn(),
};
const mockStatus = { resetStatus: jest.fn(), setError: jest.fn(), setSuccess: jest.fn() };

const ACCOUNT = { id: "acc", type: "Account", currency: { id: "ethereum" } };
let mockState = {
  account: { account: ACCOUNT, parentAccount: null, currency: { id: "ethereum" } },
  transaction: { transaction: { family: "evm", nonce: 1 }, status: { errors: {} } },
};

jest.mock("../../../../../FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: () => ({ navigation: mockNavigation }),
}));
jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowActions: () => ({ operation: mockOperation, status: mockStatus }),
  useSendFlowData: () => ({ state: mockState, source: undefined }),
}));
jest.mock("../../../../context/SponsoredSendContext", () => ({
  useSponsoredSend: () => ({ state: { phase: "idle" }, actions: {} }),
}));
jest.mock("../../../../context/SendFlowTrackingContext", () => ({
  useSendFlowTracking: () => ({
    endSession: jest.fn(),
    flowSessionId: "flow-session-id",
    trackMessage: jest.fn(),
  }),
}));
jest.mock("../../../../hooks/useSendFlowTrackingProperties", () => ({
  useSendFlowTrackingProperties: () => ({}),
}));

const mockBroadcast = jest.fn();
jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: () => mockBroadcast,
}));
jest.mock("@ledgerhq/live-common/flows/send/utils", () => ({
  ...jest.requireActual("@ledgerhq/live-common/flows/send/utils"),
  saveRecentSendRecipient: jest.fn(),
}));

function deferBroadcast() {
  let resolve: (operation: unknown) => void = () => undefined;
  mockBroadcast.mockReturnValue(new Promise(r => (resolve = r)));
  return (operation: unknown) => resolve(operation);
}

function refreshTransactionAndStatus() {
  mockState = {
    ...mockState,
    transaction: { transaction: { family: "evm", nonce: 2 }, status: { errors: {} } },
  };
}

describe("useSendSignatureSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState = {
      ...mockState,
      transaction: { transaction: { family: "evm", nonce: 1 }, status: { errors: {} } },
    };
  });

  it("keeps the first transaction and status when pinned", () => {
    const initialTransaction = mockState.transaction.transaction;
    const { result, rerender } = renderHook(() =>
      useSendSignatureSession({ pinTransaction: true }),
    );

    refreshTransactionAndStatus();
    rerender();

    expect(result.current.transaction).toBe(initialTransaction);
    expect(result.current.request?.transaction).toBe(initialTransaction);
  });

  it("completes the flow when the transaction refreshes during a pinned broadcast", async () => {
    const resolveBroadcast = deferBroadcast();
    const { result, rerender } = renderHook(() =>
      useSendSignatureSession({ pinTransaction: true }),
    );

    act(() => {
      result.current.onDeviceActionResult({ signedOperation: {} as never, device: {} });
    });
    refreshTransactionAndStatus();
    rerender();
    await act(async () => resolveBroadcast({ id: "op" }));

    await waitFor(() => expect(mockStatus.setSuccess).toHaveBeenCalledTimes(1));
    expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(1);
  });

  it("follows the live transaction when not pinned", () => {
    const { result, rerender } = renderHook(() => useSendSignatureSession());

    refreshTransactionAndStatus();
    rerender();

    expect(result.current.transaction).toBe(mockState.transaction.transaction);
  });
});
