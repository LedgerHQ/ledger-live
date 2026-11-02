import { renderHook } from "tests/testSetup";
import { trackPage } from "@shared/analytics";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import { useConfirmationViewModel } from "../useConfirmationViewModel";
import { useSendFlowActions, useSendFlowData } from "../../../../context/SendFlowContext";
import { useSendFlowTracking } from "../../../../context/SendFlowTrackingContext";
import { useFlowWizard } from "../../../../../FlowWizard/FlowWizardContext";

jest.mock("~/renderer/drawers/Provider", () => ({ setDrawer: jest.fn() }));
jest.mock("~/renderer/drawers/OperationDetails", () => ({ OperationDetails: {} }));
jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features", () => ({
  sendFeatures: {
    isUserRefusedTransactionError: jest.fn(() => false),
    getTrackingAttributes: jest.fn(() => ({})),
  },
}));
jest.mock("../../../../../FlowWizard/FlowWizardContext", () => ({ useFlowWizard: jest.fn() }));
jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowActions: jest.fn(),
  useSendFlowData: jest.fn(),
}));
jest.mock("../../../../context/SendFlowTrackingContext", () => ({
  useSendFlowTracking: jest.fn(),
}));
jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
  trackPage: jest.fn(),
}));

const currency = { id: "tron", family: "tron" };
const endSession = jest.fn();

function setFlowState({
  accountVersion,
  operation,
}: {
  accountVersion: number;
  operation: Record<string, unknown>;
}) {
  // A new object reference on every call, like the store account after addPendingOperation or a sync.
  const account = { type: "Account", id: "tron-acc", currency, version: accountVersion };
  jest.mocked(useSendFlowData).mockReturnValue({
    state: {
      account: { account, parentAccount: null, currency },
      transaction: { transaction: { family: "tron", amount: 1 }, status: undefined },
      operation,
    },
    source: "Account",
  } as unknown as ReturnType<typeof useSendFlowData>);
}

const sentEvents = () =>
  jest.mocked(trackPage).mock.calls.filter(([arg]) => {
    const category = typeof arg === "string" ? arg : arg?.category;
    return category === "Modal send - transaction sent";
  });

const rejectedEvents = () =>
  jest.mocked(trackPage).mock.calls.filter(([arg]) => {
    const category = typeof arg === "string" ? arg : arg?.category;
    return category === "Modal send - action rejected";
  });

const successOperation = {
  signed: true,
  optimisticOperation: { id: "op1" },
  transactionError: null,
};

describe("useConfirmationViewModel tracking (LIVE-38642)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(sendFeatures.isUserRefusedTransactionError).mockReturnValue(false);
    jest.mocked(useFlowWizard).mockReturnValue({ navigation: { goToStep: jest.fn() } } as never);
    jest.mocked(useSendFlowActions).mockReturnValue({
      close: jest.fn(),
      status: { resetStatus: jest.fn() },
      operation: { onRetry: jest.fn() },
    } as never);
    jest.mocked(useSendFlowTracking).mockReturnValue({
      recipientType: "external address",
      flowSessionId: "flow-session-id",
      savedContactDuringFlow: false,
      endSession,
      trackMessage: jest.fn(),
    } as never);
  });

  it("should track transaction sent once when the account is refreshed after success", () => {
    setFlowState({ accountVersion: 1, operation: successOperation });
    const { rerender } = renderHook(() => useConfirmationViewModel());
    expect(sentEvents()).toHaveLength(1);

    // addPendingOperation -> store account updated -> useSyncSendFlowAccount refreshes flow account
    setFlowState({ accountVersion: 2, operation: successOperation });
    rerender();
    // background sync confirms the operation -> new account object again
    setFlowState({ accountVersion: 3, operation: successOperation });
    rerender();

    expect(sentEvents()).toHaveLength(1);
    expect(sentEvents()[0][0]).toMatchObject({
      props: expect.objectContaining({ flow_session_id: "flow-session-id" }),
    });
  });

  it("should still track action rejected when the confirmation is idle", () => {
    setFlowState({
      accountVersion: 1,
      operation: { signed: false, optimisticOperation: null, transactionError: null },
    });
    renderHook(() => useConfirmationViewModel());

    expect(rejectedEvents()).toHaveLength(1);
    expect(sentEvents()).toHaveLength(0);
  });

  it("should not track transaction sent when the broadcast fails", () => {
    setFlowState({
      accountVersion: 1,
      operation: { signed: true, optimisticOperation: null, transactionError: new Error("boom") },
    });
    renderHook(() => useConfirmationViewModel());

    expect(sentEvents()).toHaveLength(0);
    expect(rejectedEvents()).toHaveLength(0);
  });

  it("should track transaction sent after a retry that succeeds", () => {
    setFlowState({
      accountVersion: 1,
      operation: { signed: true, optimisticOperation: null, transactionError: new Error("boom") },
    });
    const { rerender } = renderHook(() => useConfirmationViewModel());
    setFlowState({ accountVersion: 1, operation: successOperation });
    rerender();

    expect(sentEvents()).toHaveLength(1);
  });
});
