import React, { forwardRef, useImperativeHandle } from "react";
import { render, cleanup, waitFor } from "@testing-library/react";
import { useSignatureViewModel } from "../useSignatureViewModel";

// Mocks
const mockNavigation = { goToNextStep: jest.fn() };
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

type TokenCurrency = { id: string };
type AccountLike = { id: string; type: "Account" | "TokenAccount"; token?: TokenCurrency };
type MockState = {
  account: {
    account: AccountLike;
    parentAccount: { id: string } | null;
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

jest.mock("../../../../context/SendFlowContext", () => ({
  useSendFlowNavigation: jest.fn(() => ({ navigation: mockNavigation })),
  useSendFlowActions: jest.fn(() => ({ operation: mockOperation, status: mockStatus })),
  useSendFlowData: jest.fn(() => ({ state: mockState })),
}));

// eslint-disable-next-line
jest.mock("@ledgerhq/live-common/hooks/useBroadcast", () => ({
  useBroadcast: jest.fn(() => broadcastFn),
}));

// eslint-disable-next-line
// eslint-disable-next-line
jest.mock("@ledgerhq/live-common/bridge/descriptor", () => {
  const isUserRefusedTransactionError = jest.fn(() => false);
  return { sendFeatures: { isUserRefusedTransactionError } };
});

// Accessor for the mocked function
const getIsUserRefusedTransactionErrorMock = () =>
  require("@ledgerhq/live-common/bridge/descriptor").sendFeatures
    .isUserRefusedTransactionError as jest.Mock;
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
    getIsUserRefusedTransactionErrorMock().mockReset().mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
  });

  test("exposes action and builds request with tokenCurrency for TokenAccount", () => {
    mockState.account.account = { id: "tokAcc", type: "TokenAccount", token: { id: "token-1" } };
    mockState.account.parentAccount = { id: "parent-acc" };

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);

    expect(ref.current?.action).toBe(actionMock);
    expect(ref.current?.request).toEqual({
      tokenCurrency: { id: "token-1" },
      parentAccount: { id: "parent-acc" },
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
    getIsUserRefusedTransactionErrorMock().mockReturnValue(true);
    expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(1);
  });

  test("finishWithError resets status when user refused error is detected", () => {
    getIsUserRefusedTransactionErrorMock().mockReturnValue(true);

    const ref = React.createRef<HookApi>();
    render(<Harness ref={ref} />);
    const error = new Error("user refused");

    ref.current?.finishWithError(error);

    expect(getIsUserRefusedTransactionErrorMock()).toHaveBeenCalled();
    expect(mockStatus.resetStatus).toHaveBeenCalledTimes(1);
    expect(mockStatus.setError).not.toHaveBeenCalled();
    expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(1);
  });

  test("finishWithError sets error status when not a user refused error", () => {
    getIsUserRefusedTransactionErrorMock().mockReturnValue(false);
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
    const { rerender } = render(<Harness ref={ref} />);

    ref.current?.finishWithError(new Error("first"));
    expect(mockOperation.onTransactionError).toHaveBeenCalledTimes(1);
    expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(1);

    // Change a dependency (transaction) and rerender
    mockState.transaction = { transaction: { id: "tx2" }, status: { ok: true } };
    rerender(<Harness ref={ref} />);

    ref.current?.finishWithError(new Error("second"));
    expect(mockOperation.onTransactionError).toHaveBeenCalledTimes(2);
    expect(mockNavigation.goToNextStep).toHaveBeenCalledTimes(2);
  });
});
