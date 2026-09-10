import React, { forwardRef, useImperativeHandle } from "react";
import { render, cleanup, waitFor } from "tests/testSetup";
import { SEND_FLOW_SOURCE, SEND_FLOW_STEP } from "@ledgerhq/live-common/flows/send/types";
import { SPONSORED_PHASE } from "@ledgerhq/live-common/flows/send/sponsored/types";
import { useSignatureViewModel } from "../useSignatureViewModel";

declare global {
  // eslint-disable-next-line no-var
  var __isUserRefusedTransactionErrorMock: jest.Mock;
}

// Mocks
const reduxDispatchMock = jest.fn();
jest.mock("LLD/hooks/redux", () => {
  const actual = jest.requireActual("LLD/hooks/redux");
  return {
    ...actual,
    useDispatch: () => reduxDispatchMock,
  };
});
const mockNavigation = { goToNextStep: jest.fn(), goToStep: jest.fn() };
let mockSource: string | undefined;
const mockOperation = {
  onTransactionError: jest.fn(),
  onOperationBroadcasted: jest.fn(),
  onSigned: jest.fn(),
};
const mockStatus = {
  resetStatus: jest.fn(),
  setError: jest.fn(),
  setSuccess: jest.fn(),
};
const mockClose = jest.fn();
const mockSponsoredActions = { onTransferSuccess: jest.fn(), onTransferError: jest.fn() };
// IDLE by default: an ordinary send must not touch the sponsored machine.
let mockSponsoredPhase: string = SPONSORED_PHASE.IDLE;

type TokenCurrency = { id: string };
type AccountLike = { id: string; type: "Account" | "TokenAccount"; token?: TokenCurrency };
type MockState = {
  account: {
    account: AccountLike;
    parentAccount: { id: string; currency: { family: string } } | null;
    currency: { id: string } | null;
  };
  transaction: {
    transaction: { id: string };
    status: { ok: boolean };
  };
};

let mockState: MockState = {
  account: {
    account: { id: "acc", type: "Account" },
    parentAccount: null,
    currency: { id: "currency" },
  },
  transaction: {
    transaction: { id: "tx" },
    status: { ok: true },
  },
};

const broadcastFn = jest.fn();
const actionMock = jest.fn();

jest.mock("../../../../../FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: jest.fn(() => ({ navigation: mockNavigation })),
}));

jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowActions: jest.fn(() => ({
    operation: mockOperation,
    status: mockStatus,
    close: mockClose,
  })),
  useSendFlowData: jest.fn(() => ({ state: mockState, source: mockSource })),
}));

jest.mock("../../../../context/SponsoredSendContext", () => ({
  useSponsoredSend: jest.fn(() => ({
    state: { phase: mockSponsoredPhase },
    actions: mockSponsoredActions,
  })),
}));

// eslint-disable-next-line
jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: jest.fn(() => broadcastFn),
}));

// eslint-disable-next-line
jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features", () => {
  global.__isUserRefusedTransactionErrorMock = jest.fn(() => false);
  return {
    sendFeatures: {
      isUserRefusedTransactionError: global.__isUserRefusedTransactionErrorMock,
    },
  };
});
jest.mock(
  "~/renderer/hooks/useConnectAppAction",
  () => ({
    useTransactionAction: jest.fn(() => actionMock),
  }),
  { virtual: true },
);

// Harness to access hook API
type HookApi = ReturnType<typeof useSignatureViewModel>;
const Harness = forwardRef<HookApi>(function Harness(_props, ref) {
  const api = useSignatureViewModel();
  useImperativeHandle(ref, () => api);
  return null;
});

describe("useSignatureViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reduxDispatchMock.mockReset();
    mockClose.mockReset();
    mockSource = undefined;
    mockState = {
      account: {
        account: { id: "acc", type: "Account" },
        parentAccount: null,
        currency: { id: "currency" },
      },
      transaction: {
        transaction: { id: "tx" },
        status: { ok: true },
      },
    };
    broadcastFn.mockReset();
    mockSponsoredPhase = SPONSORED_PHASE.IDLE;
    global.__isUserRefusedTransactionErrorMock.mockReset().mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
  });

  test("exposes action and builds request with tokenCurrency for TokenAccount", () => {
    mockState.account.account = { id: "tokAcc", type: "TokenAccount", token: { id: "token-1" } };
    mockState.account.parentAccount = { id: "parent-acc", currency: { family: "family" } };

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    expect(ref.current?.action).toBe(actionMock);
    expect(ref.current?.request).toEqual({
      tokenCurrency: { id: "token-1" },
      parentAccount: { id: "parent-acc", currency: { family: "family" } },
      account: { id: "tokAcc", type: "TokenAccount", token: { id: "token-1" } },
      transaction: { id: "tx" },
      status: { ok: true },
    });
  });

  test("finishWithError resets status when currency is null", () => {
    mockState.account.currency = null;

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    const error = new Error("boom");

    ref.current?.finishWithError(error);

    expect(mockOperation.onTransactionError).toHaveBeenCalledTimes(1);
    expect(mockOperation.onTransactionError).toHaveBeenCalledWith(error);
    expect(mockStatus.resetStatus).toHaveBeenCalledTimes(1);
    expect(mockStatus.setError).not.toHaveBeenCalled();
    expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(1);

    // idempotent
    ref.current?.finishWithError(new Error("another"));
    global.__isUserRefusedTransactionErrorMock.mockReturnValue(true);
    expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(1);
  });

  test("finishWithError resets status when user refused error is detected", () => {
    global.__isUserRefusedTransactionErrorMock.mockReturnValue(true);

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);
    const error = new Error("user refused");

    ref.current?.finishWithError(error);

    expect(global.__isUserRefusedTransactionErrorMock).toHaveBeenCalled();
    expect(mockStatus.resetStatus).toHaveBeenCalledTimes(1);
    expect(mockStatus.setError).not.toHaveBeenCalled();
    expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(1);
  });

  test("finishWithError sets error status when not a user refused error", () => {
    global.__isUserRefusedTransactionErrorMock.mockReturnValue(false);
    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    ref.current?.finishWithError(new Error("other"));

    expect(mockStatus.setError).toHaveBeenCalledTimes(1);
    expect(mockStatus.resetStatus).not.toHaveBeenCalled();
    expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(1);
  });

  test("onDeviceActionResult: handles transactionSignError", () => {
    mockState.account.currency = null;

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    ref.current?.onDeviceActionResult({ transactionSignError: new Error("sign failed") });

    expect(mockOperation.onTransactionError).toHaveBeenCalledTimes(1);
    expect(mockStatus.resetStatus).toHaveBeenCalledTimes(1);
    expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(1);
  });

  test("onDeviceActionResult: missing signed operation triggers error", () => {
    mockState.account.currency = null;

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    ref.current?.onDeviceActionResult({ signedOperation: null, device: {} });

    expect(mockOperation.onTransactionError).toHaveBeenCalledTimes(1);
    expect(mockOperation.onTransactionError.mock.calls[0][0].message).toBe(
      "Missing signed operation",
    );
    expect(mockStatus.resetStatus).toHaveBeenCalledTimes(1);
    expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(1);
  });

  test("onDeviceActionResult: broadcast resolves -> success flow", async () => {
    const op = { id: "op1" };
    broadcastFn.mockResolvedValue(op);

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    // @ts-expect-error - providing minimal stub for SignedOperation in tests
    ref.current?.onDeviceActionResult({ signedOperation: { raw: "sig" }, device: {} });

    await waitFor(() => {
      expect(mockOperation.onSigned).toHaveBeenCalledTimes(1);
      expect(mockOperation.onOperationBroadcasted).toHaveBeenCalledWith(op);
      expect(mockStatus.setSuccess).toHaveBeenCalledTimes(1);
      expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(1);
    });

    // idempotent: second call shouldn't trigger again
    // @ts-expect-error - providing minimal stub for SignedOperation in tests
    ref.current?.onDeviceActionResult({ signedOperation: { raw: "sig2" }, device: {} });
    expect(mockOperation.onOperationBroadcasted).toHaveBeenCalledTimes(1);
    expect(mockStatus.setSuccess).toHaveBeenCalledTimes(1);
    expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(1);
  });

  test("onDeviceActionResult: broadcast rejects with Error -> error flow", async () => {
    mockState.account.currency = null;
    const err = new Error("network");
    broadcastFn.mockRejectedValueOnce(err);

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    // @ts-expect-error - providing minimal stub for SignedOperation in tests
    ref.current?.onDeviceActionResult({ signedOperation: { raw: "sig" }, device: {} });

    await waitFor(() => {
      expect(mockOperation.onSigned).toHaveBeenCalledTimes(1);
      expect(mockOperation.onTransactionError).toHaveBeenCalledWith(err);
      expect(mockStatus.resetStatus).toHaveBeenCalledTimes(1);
      expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(1);
    });
  });

  test("onDeviceActionResult: broadcast rejects with non-Error -> normalized Error", async () => {
    mockState.account.currency = null;
    broadcastFn.mockRejectedValueOnce("oops");

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    // @ts-expect-error - providing minimal stub for SignedOperation in tests
    ref.current?.onDeviceActionResult({ signedOperation: { raw: "sig" }, device: {} });

    await waitFor(() => {
      expect(mockOperation.onTransactionError).toHaveBeenCalledTimes(1);
      const arg = mockOperation.onTransactionError.mock.calls[0][0];
      expect(arg).toBeInstanceOf(Error);
      expect(arg.message).toBe("oops");
      expect(mockStatus.resetStatus).toHaveBeenCalledTimes(1);
      expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(1);
    });
  });

  test("hasFinishedRef resets when dependencies change", () => {
    mockState.account.currency = null;

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    ref.current?.finishWithError(new Error("first"));
    expect(mockOperation.onTransactionError).toHaveBeenCalledTimes(1);
    expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(1);

    // Change a dependency (transaction) and rerender
    mockState.transaction = { transaction: { id: "tx2" }, status: { ok: true } };
    render(<Harness ref={ref} />);

    ref.current?.finishWithError(new Error("second"));
    expect(mockOperation.onTransactionError).toHaveBeenCalledTimes(2);
    expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(2);
  });

  test("routes to the Pay success step on success when launched from Pay", async () => {
    mockSource = SEND_FLOW_SOURCE.PAY;
    const op = { id: "op-pay" };
    broadcastFn.mockResolvedValue(op);

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    // @ts-expect-error - providing minimal stub for SignedOperation in tests
    ref.current?.onDeviceActionResult({ signedOperation: { raw: "sig" }, device: {} });

    await waitFor(() => {
      expect(mockStatus.setSuccess).toHaveBeenCalledTimes(1);
      expect(mockNavigation.goToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.PAY_SUCCESS);
    });
    expect(mockNavigation.goToNextStep).not.toHaveBeenCalled();
  });

  test("routes to confirmation on success for a regular (non-Pay) send", async () => {
    const op = { id: "op-regular" };
    broadcastFn.mockResolvedValue(op);

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    // @ts-expect-error - providing minimal stub for SignedOperation in tests
    ref.current?.onDeviceActionResult({ signedOperation: { raw: "sig" }, device: {} });

    await waitFor(() => {
      expect(mockStatus.setSuccess).toHaveBeenCalledTimes(1);
      expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(1);
    });
    expect(mockNavigation.goToStep).not.toHaveBeenCalled();
  });

  test("routes to confirmation on failure even when launched from Pay", () => {
    mockSource = SEND_FLOW_SOURCE.PAY;
    mockState.account.currency = null;

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    ref.current?.finishWithError(new Error("boom"));

    expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(1);
    expect(mockNavigation.goToStep).not.toHaveBeenCalled();
  });

  test("leaves the sponsored machine untouched for an ordinary send", async () => {
    broadcastFn.mockResolvedValue({ id: "op" });

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    // @ts-expect-error - providing minimal stub for SignedOperation in tests
    ref.current?.onDeviceActionResult({ signedOperation: { raw: "sig" }, device: {} });

    await waitFor(() => expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(1));
    expect(mockSponsoredActions.onTransferSuccess).not.toHaveBeenCalled();
    expect(mockSponsoredActions.onTransferError).not.toHaveBeenCalled();
  });

  test("reports TX-C success to the sponsored orchestration, then advances", async () => {
    mockSponsoredPhase = SPONSORED_PHASE.TRANSFER;
    broadcastFn.mockResolvedValue({ id: "op-sponsored" });

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    // @ts-expect-error - providing minimal stub for SignedOperation in tests
    ref.current?.onDeviceActionResult({ signedOperation: { raw: "sig" }, device: {} });

    await waitFor(() => expect(mockSponsoredActions.onTransferSuccess).toHaveBeenCalledTimes(1));
    expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(1);
  });

  test("routes a TX-C failure to SPONSORED_FAILURE with the error, not to confirmation", () => {
    mockSponsoredPhase = SPONSORED_PHASE.TRANSFER;
    mockState.account.currency = null;
    const error = new Error("transfer boom");

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    ref.current?.finishWithError(error);

    expect(mockSponsoredActions.onTransferError).toHaveBeenCalledWith(error);
    expect(mockNavigation.goToStep).toHaveBeenCalledWith(SEND_FLOW_STEP.SPONSORED_FAILURE);
    expect(mockNavigation.goToNextStep).not.toHaveBeenCalled();
  });
});
