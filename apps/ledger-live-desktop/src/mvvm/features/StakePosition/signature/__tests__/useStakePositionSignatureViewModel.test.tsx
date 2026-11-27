import { act, renderHook, waitFor } from "tests/testSetup";
import type { ExecutorState } from "@features/platform-device-intent";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Account, SignedOperation } from "@ledgerhq/types-live";
import { buildDeviceInitializationInput } from "LLD/components/DeviceIntentExecutor";
import {
  useStakePositionSignatureViewModel,
  type StakePositionSignatureProps,
} from "../useStakePositionSignatureViewModel";

jest.mock("@ledgerhq/transaction-observability", () => ({
  ...jest.requireActual("@ledgerhq/transaction-observability"),
  emitTransactionEvent: jest.fn(),
}));
jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
}));

const ACCOUNT = {
  type: "Account",
  id: "solana-account",
  currency: { id: "solana", family: "solana", ticker: "SOL" },
} as unknown as Account;
const TRANSACTION = { family: "solana", mode: "undelegate" } as unknown as Transaction;
const STATUS = { errors: {}, warnings: {} } as unknown as TransactionStatus;
const INITIALIZATION_INPUT = { appRequest: { appName: "Solana" } };
const SIGNED_OPERATION = { signature: "signed", operation: { id: "op" } } as SignedOperation;
const DISCONNECTED = { type: "deviceDisconnected", device: {} } as unknown as ExecutorState;

function setup(overrides: Partial<StakePositionSignatureProps> = {}) {
  const props: StakePositionSignatureProps = {
    account: ACCOUNT,
    transaction: TRANSACTION,
    status: STATUS,
    action: "deactivate",
    onSigned: jest.fn(),
    onFailed: jest.fn(),
    onCancel: jest.fn(),
    ...overrides,
  };
  const hook = renderHook(
    (current: StakePositionSignatureProps) => useStakePositionSignatureViewModel(current),
    { initialProps: props },
  );
  return { ...hook, props };
}

describe("useStakePositionSignatureViewModel", () => {
  beforeEach(() => {
    jest.mocked(buildDeviceInitializationInput).mockResolvedValue(INITIALIZATION_INPUT as never);
  });

  it("prepares the device for the staking flow of the account, and signs the transaction it opened with", async () => {
    const { result, rerender, props } = setup();

    await waitFor(() => expect(result.current.initializationInput).toBe(INITIALIZATION_INPUT));
    expect(buildDeviceInitializationInput).toHaveBeenCalledWith({
      appRequest: { account: ACCOUNT },
      flow: "staking",
    });
    rerender({ ...props, transaction: { ...TRANSACTION, mode: "unstake" } as Transaction });
    expect(result.current.intent.input).toEqual({
      account: ACCOUNT,
      parentAccount: undefined,
      transaction: TRANSACTION,
      status: STATUS,
    });
  });

  it("fails when the device cannot be prepared", async () => {
    const failure = new Error("no app for this currency");
    jest.mocked(buildDeviceInitializationInput).mockRejectedValueOnce(failure);
    const { props } = setup();

    await waitFor(() => expect(props.onFailed).toHaveBeenCalledWith(failure));
  });

  it("hands the signature over once, when the job ends", () => {
    const { result, props } = setup();

    act(() => result.current.intent.onResult?.(SIGNED_OPERATION));
    expect(props.onSigned).not.toHaveBeenCalled();
    act(() => result.current.onIntentJobComplete());
    act(() => result.current.onIntentJobComplete());

    expect(props.onSigned).toHaveBeenCalledTimes(1);
    expect(props.onSigned).toHaveBeenCalledWith(SIGNED_OPERATION);
  });

  it("hands nothing over when the job ends without a signature", () => {
    const { result, props } = setup();

    act(() => result.current.onIntentJobComplete());

    expect(props.onSigned).not.toHaveBeenCalled();
  });

  it("hands the signature over when the device disconnects once it signed", () => {
    const { result, props } = setup();

    act(() => result.current.onExecutorStateChanged(DISCONNECTED));
    expect(props.onSigned).not.toHaveBeenCalled();
    act(() => result.current.intent.onResult?.(SIGNED_OPERATION));
    act(() => result.current.onExecutorStateChanged(DISCONNECTED));

    expect(props.onSigned).toHaveBeenCalledWith(SIGNED_OPERATION);
  });

  it.each([
    ["the user refuses on the device", { type: "cancelled", retry: jest.fn() } as const],
    [
      "the signature fails",
      {
        type: "error",
        error: new Error("The device answered an error"),
        retry: jest.fn(),
      } as const,
    ],
  ])("stays on the device step when %s, for its retry", (_, jobState) => {
    const { result, props } = setup();

    act(() => result.current.onIntentJobStateChanged(jobState));

    expect(props.onFailed).not.toHaveBeenCalled();
    expect(props.onCancel).not.toHaveBeenCalled();
    expect(props.onSigned).not.toHaveBeenCalled();
  });

  it("signs the retry after a refusal", () => {
    const { result, props } = setup();

    act(() => result.current.onIntentJobStateChanged({ type: "cancelled", retry: jest.fn() }));
    act(() => result.current.intent.onResult?.(SIGNED_OPERATION));
    act(() => result.current.onIntentJobComplete());

    expect(props.onSigned).toHaveBeenCalledWith(SIGNED_OPERATION);
  });

  it("names the device the executor connects to", () => {
    const { result } = setup();

    act(() =>
      result.current.onExecutorStateChanged({
        type: "executingIntent",
        connectionResult: { compatDeviceName: "Lily's Ledger" },
      } as unknown as ExecutorState),
    );

    expect(result.current.extraProps).toEqual({
      deviceName: "Lily's Ledger",
      action: "deactivate",
    });
  });

  it("names the exit being signed", () => {
    const { result } = setup({ action: "withdraw" });

    expect(result.current.extraProps).toEqual({ deviceName: "", action: "withdraw" });
  });

  it("cancels only while nothing is signed", () => {
    const { result, props } = setup();

    act(() => result.current.onUserCancel());
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    act(() => result.current.intent.onResult?.(SIGNED_OPERATION));
    act(() => result.current.onUserCancel());

    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });
});
