import { act, renderHook, waitFor } from "@tests/test-renderer";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { ExecutorState } from "@features/platform-device-intent";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Account, SignedOperation } from "@ledgerhq/types-live";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
import {
  useStakePositionSignatureViewModel,
  type StakePositionSignatureProps,
} from "../useStakePositionSignatureViewModel";

jest.mock("@ledgerhq/transaction-observability", () => ({
  ...jest.requireActual("@ledgerhq/transaction-observability"),
  emitTransactionEvent: jest.fn(),
}));
jest.mock("LLM/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
}));

const ACCOUNT = {
  type: "Account",
  id: "solana-account",
  currency: { id: "solana", family: "solana", ticker: "SOL" },
} as unknown as Account;
const TRANSACTION = { family: "solana", mode: "undelegate" } as unknown as Transaction;
const STATUS = { errors: {}, warnings: {} } as unknown as TransactionStatus;
const INITIALIZATION_INPUT = { appName: "Solana" };
const SIGNED_OPERATION = { signature: "signed", operation: { id: "op" } } as SignedOperation;
const DISCONNECTED = { type: "deviceDisconnected", device: {} } as unknown as ExecutorState;

function setup(overrides: Partial<StakePositionSignatureProps> = {}) {
  const props: StakePositionSignatureProps = {
    account: ACCOUNT,
    transaction: TRANSACTION,
    status: STATUS,
    isOpen: true,
    onSigned: jest.fn(),
    onFailed: jest.fn(),
    onCancel: jest.fn(),
    onDismissed: jest.fn(),
    ...overrides,
  };
  let currentProps = props;
  const hook = renderHook(() => useStakePositionSignatureViewModel(currentProps));
  const rerender = (next: Partial<StakePositionSignatureProps>) => {
    currentProps = { ...currentProps, ...next };
    hook.rerender({});
  };
  return { ...hook, props, rerender };
}

describe("useStakePositionSignatureViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(buildDeviceInitializationInput).mockResolvedValue(INITIALIZATION_INPUT as never);
  });

  it("should prepare the device for the staking flow of the account, and sign the transaction it opened with", async () => {
    const { result, rerender } = setup();

    await waitFor(() => expect(result.current.initializationInput).toBe(INITIALIZATION_INPUT));
    expect(buildDeviceInitializationInput).toHaveBeenCalledWith({
      appRequest: { account: ACCOUNT },
      flow: "staking",
    });
    rerender({ transaction: { ...TRANSACTION, mode: "unstake" } as Transaction });
    expect(result.current.intent.input).toEqual({
      account: ACCOUNT,
      parentAccount: undefined,
      transaction: TRANSACTION,
      status: STATUS,
    });
  });

  it("should fail when the device cannot be prepared", async () => {
    const failure = new Error("no app for this currency");
    jest.mocked(buildDeviceInitializationInput).mockRejectedValueOnce(failure);
    const { props } = setup();

    await waitFor(() => expect(props.onFailed).toHaveBeenCalledWith(failure));
  });

  it("should hand the signature over once, when the job ends", () => {
    const { result, props } = setup();

    act(() => result.current.intent.onResult?.(SIGNED_OPERATION));
    expect(props.onSigned).not.toHaveBeenCalled();
    act(() => result.current.onIntentJobComplete());
    act(() => result.current.onIntentJobComplete());

    expect(props.onSigned).toHaveBeenCalledTimes(1);
    expect(props.onSigned).toHaveBeenCalledWith(SIGNED_OPERATION);
  });

  it("should hand nothing over when the job ends without a signature", () => {
    const { result, props } = setup();

    act(() => result.current.onIntentJobComplete());

    expect(props.onSigned).not.toHaveBeenCalled();
  });

  it("should hand the signature over when the device disconnects once it signed", () => {
    const { result, props } = setup();

    act(() => result.current.onExecutorStateChanged(DISCONNECTED));
    expect(props.onSigned).not.toHaveBeenCalled();
    act(() => result.current.intent.onResult?.(SIGNED_OPERATION));
    act(() => result.current.onExecutorStateChanged(DISCONNECTED));

    expect(props.onSigned).toHaveBeenCalledWith(SIGNED_OPERATION);
  });

  it("should fail with a refusal when the user refuses on the device", () => {
    const { result, props } = setup();

    act(() => result.current.onIntentJobStateChanged({ type: "cancelled", retry: jest.fn() }));

    expect(props.onFailed).toHaveBeenCalledWith(expect.any(UserRefusedOnDevice));
  });

  it("should fail with the error of the signature", () => {
    const error = new Error("The device answered an error");
    const { result, props } = setup();

    act(() => result.current.onIntentJobStateChanged({ type: "error", error, retry: jest.fn() }));

    expect(props.onFailed).toHaveBeenCalledWith(error);
  });

  it("should name the device the executor connects to", () => {
    const { result } = setup();

    act(() =>
      result.current.onExecutorStateChanged({
        type: "executingIntent",
        connectionResult: { compatDeviceName: "Lily's Ledger" },
      } as unknown as ExecutorState),
    );

    expect(result.current.extraProps).toEqual({ deviceName: "Lily's Ledger" });
  });

  it("should cancel only while nothing is signed", () => {
    const { result, props } = setup();

    act(() => result.current.onUserCancel());
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    act(() => result.current.intent.onResult?.(SIGNED_OPERATION));
    act(() => result.current.onUserCancel());

    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it("should not cancel on the close that follows a failed signature", () => {
    const { result, props } = setup();

    act(() => result.current.onIntentJobStateChanged({ type: "cancelled", retry: jest.fn() }));
    act(() => result.current.onUserCancel());

    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it("should not cancel when its sheet closes because the step is over", () => {
    const { result, props, rerender } = setup();

    rerender({ isOpen: false });
    act(() => result.current.onUserCancel());

    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it("should be dismissed at once when closed before the executor showed", () => {
    jest.mocked(buildDeviceInitializationInput).mockReturnValueOnce(new Promise(() => undefined));
    const { props, rerender } = setup();
    expect(props.onDismissed).not.toHaveBeenCalled();

    rerender({ isOpen: false });

    expect(props.onDismissed).toHaveBeenCalledTimes(1);
  });

  it("should wait for its sheet to animate out once the executor showed", async () => {
    const { result, props, rerender } = setup();
    await waitFor(() => expect(result.current.initializationInput).toBe(INITIALIZATION_INPUT));

    rerender({ isOpen: false });

    expect(result.current.isOpen).toBe(false);
    expect(props.onDismissed).not.toHaveBeenCalled();
  });
});
