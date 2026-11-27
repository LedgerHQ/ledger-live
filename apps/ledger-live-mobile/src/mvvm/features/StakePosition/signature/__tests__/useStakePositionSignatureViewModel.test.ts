import { act, renderHook, waitFor } from "@tests/test-renderer";
import type { ExecutorState } from "@features/platform-device-intent";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { emitTransactionEvent } from "@ledgerhq/transaction-observability";
import { DeviceModelId } from "@ledgerhq/types-devices";
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
    action: "deactivate",
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
  ])("should stay on the device step when %s, for its retry", (_case, jobState) => {
    const { result, props } = setup();

    act(() => result.current.onIntentJobStateChanged(jobState));

    expect(props.onFailed).not.toHaveBeenCalled();
    expect(props.onCancel).not.toHaveBeenCalled();
    expect(props.onSigned).not.toHaveBeenCalled();
  });

  it("should sign the retry after a refusal", () => {
    const { result, props } = setup();

    act(() => result.current.onIntentJobStateChanged({ type: "cancelled", retry: jest.fn() }));
    act(() => result.current.intent.onResult?.(SIGNED_OPERATION));
    act(() => result.current.onIntentJobComplete());

    expect(props.onSigned).toHaveBeenCalledTimes(1);
    expect(props.onSigned).toHaveBeenCalledWith(SIGNED_OPERATION);
    expect(props.onFailed).not.toHaveBeenCalled();
  });

  it("should hand the signature over once when the device disconnects after the job ended", () => {
    const { result, props } = setup();

    act(() => result.current.intent.onResult?.(SIGNED_OPERATION));
    act(() => result.current.onIntentJobComplete());
    act(() => result.current.onExecutorStateChanged(DISCONNECTED));

    expect(props.onSigned).toHaveBeenCalledTimes(1);
    expect(props.onFailed).not.toHaveBeenCalled();
  });

  describe("the sign attempt", () => {
    const PENDING = { type: "pending", deviceModelId: DeviceModelId.europa } as const;
    const PROMPTED = {
      type: "device-signature-requested",
      deviceModelId: DeviceModelId.europa,
    } as const;

    it("should report an attempt the user leaves while the device waits for them as abandoned", () => {
      const { result, unmount } = setup();
      act(() => result.current.onIntentJobStateChanged(PENDING));
      act(() => result.current.onIntentJobStateChanged(PROMPTED));

      unmount();

      expect(emitTransactionEvent).toHaveBeenCalledTimes(1);
      expect(emitTransactionEvent).toHaveBeenCalledWith(
        expect.objectContaining({ status: "failure", abandoned: true, operationalOnly: false }),
      );
    });

    it("should report an attempt the user leaves before the device asked for anything as operational only", () => {
      const { result, unmount } = setup();
      act(() => result.current.onIntentJobStateChanged(PENDING));

      unmount();

      expect(emitTransactionEvent).toHaveBeenCalledWith(
        expect.objectContaining({ abandoned: true, operationalOnly: true }),
      );
    });

    it.each([
      ["a refusal", { type: "cancelled", retry: jest.fn() } as const],
      [
        "a failed signature",
        { type: "error", error: new Error("The device answered an error"), retry: jest.fn() },
      ],
    ] as const)("should not report %s as an abandoned attempt", (_case, settled) => {
      const { result, unmount } = setup();
      act(() => result.current.onIntentJobStateChanged(PENDING));
      act(() => result.current.onIntentJobStateChanged(PROMPTED));
      act(() => result.current.onIntentJobStateChanged(settled));

      unmount();

      expect(emitTransactionEvent).not.toHaveBeenCalled();
    });

    it("should report the retry of a refusal that the user leaves as a new, abandoned attempt", () => {
      const { result, unmount } = setup();
      act(() => result.current.onIntentJobStateChanged(PENDING));
      act(() => result.current.onIntentJobStateChanged({ type: "cancelled", retry: jest.fn() }));
      act(() => result.current.onIntentJobStateChanged(PENDING));

      unmount();

      expect(emitTransactionEvent).toHaveBeenCalledTimes(1);
      expect(emitTransactionEvent).toHaveBeenCalledWith(
        expect.objectContaining({ abandoned: true }),
      );
    });
  });

  it("should name the device the executor connects to", () => {
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

  it("should name the exit being signed", () => {
    const { result } = setup({ action: "withdraw" });

    expect(result.current.extraProps).toEqual({ deviceName: "", action: "withdraw" });
  });

  it("should cancel only while nothing is signed", () => {
    const { result, props } = setup();

    act(() => result.current.onUserCancel());
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    act(() => result.current.intent.onResult?.(SIGNED_OPERATION));
    act(() => result.current.onUserCancel());

    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["a refusal", { type: "cancelled", retry: jest.fn() } as const],
    [
      "a failed signature",
      {
        type: "error",
        error: new Error("The device answered an error"),
        retry: jest.fn(),
      } as const,
    ],
  ])(
    "should cancel on the close that follows %s, which leaves the device step",
    (_case, jobState) => {
      const { result, props } = setup();

      act(() => result.current.onIntentJobStateChanged(jobState));
      act(() => result.current.onUserCancel());

      expect(props.onCancel).toHaveBeenCalledTimes(1);
      expect(props.onFailed).not.toHaveBeenCalled();
    },
  );

  it("should not cancel on the close that follows a device step that could not start", async () => {
    jest.mocked(buildDeviceInitializationInput).mockRejectedValueOnce(new Error("no app"));
    const { result, props } = setup();
    await waitFor(() => expect(props.onFailed).toHaveBeenCalledTimes(1));

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
