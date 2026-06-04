/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { TransportStatusError, UserRefusedOnDevice } from "@ledgerhq/errors";
import { getMainAccount } from "../../../account/index";
import { getAccountBridge } from "../../../bridge/index";
import type { DeviceConnectionResult, DeviceExtractedContext } from "@ledgerhq/device-intent";
import type {
  Account,
  AccountLike,
  SignOperationEvent,
  SignedOperation,
} from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Observable, of, throwError } from "rxjs";
import { signTransactionIntentJob } from "../job";
import type { SignTransactionIntentInput, SignTransactionIntentJobState } from "../types";

jest.mock("../../../account/index", () => ({
  getMainAccount: jest.fn(),
}));

jest.mock("../../../bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));

const account = { id: "account-1" } as AccountLike;
const parentAccount = { id: "parent-account-1" } as Account;
const mainAccount = { id: "main-account-1" } as Account;
const transaction = { family: "evm" } as SignTransactionIntentInput["transaction"];
const signedOperation = { operation: { id: "operation-1" } } as SignedOperation;

const deviceConnectionResult: DeviceConnectionResult = {
  dmk: null as unknown as DeviceConnectionResult["dmk"],
  sessionId: "session-1",
  connectedDevice: null as unknown as DeviceConnectionResult["connectedDevice"],
  compatDeviceId: "device-1",
  compatDeviceName: "Device 1",
  compatDeviceModelId: DeviceModelId.nanoX,
  compatDeviceWired: true,
};

const deviceExtractedContext: DeviceExtractedContext = {
  currentOsVersion: "1.0.0",
  osUpdateAvailable: false,
  currentAppName: "Ethereum",
  currentAppVersion: "1.0.0",
};

const deviceModelId = DeviceModelId.nanoX;

const input: SignTransactionIntentInput = {
  account,
  parentAccount,
  transaction,
};

type BridgeMock = {
  signOperation: jest.Mock<Observable<SignOperationEvent>, [unknown]>;
};

function createBridgeMock(events$: Observable<SignOperationEvent>): BridgeMock {
  return {
    signOperation: jest.fn((_params: unknown) => events$),
  };
}

function mockGetAccountBridgeResolvedValue(bridge: BridgeMock) {
  jest
    .mocked(getAccountBridge)
    .mockResolvedValue(bridge as unknown as Awaited<ReturnType<typeof getAccountBridge>>);
}

function startJob() {
  return signTransactionIntentJob({ deviceConnectionResult, deviceExtractedContext, input });
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("signTransactionIntentJob", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getMainAccount).mockReturnValue(mainAccount);
  });

  it("should sign with the main account and emit mapped bridge states", async () => {
    const signOperationEvents: SignOperationEvent[] = [
      { type: "device-signature-requested" },
      { type: "device-streaming", progress: 0.42, index: 1, total: 2 },
      { type: "device-signature-granted" },
      { type: "signed", signedOperation },
    ];
    const bridge = createBridgeMock(of(...signOperationEvents));
    mockGetAccountBridgeResolvedValue(bridge);

    const states = await new Promise<SignTransactionIntentJobState[]>((resolve, reject) => {
      const emittedStates: SignTransactionIntentJobState[] = [];

      startJob().subscribe({
        next: state => emittedStates.push(state),
        error: reject,
        complete: () => resolve(emittedStates),
      });
    });

    expect(getMainAccount).toHaveBeenCalledWith(account, parentAccount);
    expect(getAccountBridge).toHaveBeenCalledWith(mainAccount);
    expect(bridge.signOperation).toHaveBeenCalledWith({
      account: mainAccount,
      transaction,
      deviceId: "device-1",
      deviceModelId,
    });
    expect(states).toEqual([
      { type: "pending", deviceModelId },
      { type: "device-signature-requested", deviceModelId },
      { type: "device-streaming", progress: 0.42 },
      { type: "device-signature-granted", deviceModelId },
      { type: "signed", signedOperation },
    ]);
  });

  it("should emit a cancellable state when the user refuses on device", async () => {
    const bridge = createBridgeMock(throwError(() => new UserRefusedOnDevice()));
    mockGetAccountBridgeResolvedValue(bridge);

    const states: SignTransactionIntentJobState[] = [];
    const subscription = startJob().subscribe(state => states.push(state));

    await flushPromises();

    expect(states).toHaveLength(2);
    expect(states[0]).toEqual({ type: "pending", deviceModelId });
    expect(states[1]).toEqual({
      type: "cancelled",
      retry: expect.any(Function),
    });

    subscription.unsubscribe();
  });

  it("should retry signing when a cancelled state retry is called", async () => {
    const bridge = createBridgeMock(throwError(() => new TransportStatusError(0x6985)));
    bridge.signOperation.mockReturnValueOnce(throwError(() => new TransportStatusError(0x6985)));
    bridge.signOperation.mockReturnValueOnce(of({ type: "signed", signedOperation }));
    mockGetAccountBridgeResolvedValue(bridge);

    const states: SignTransactionIntentJobState[] = [];
    const subscription = startJob().subscribe(state => states.push(state));

    await flushPromises();
    const cancelledState = states[1];
    if (cancelledState?.type !== "cancelled") {
      throw new Error("Expected cancelled state");
    }

    cancelledState.retry();
    await flushPromises();

    expect(bridge.signOperation).toHaveBeenCalledTimes(2);
    expect(states).toEqual([
      { type: "pending", deviceModelId },
      { type: "cancelled", retry: expect.any(Function) },
      { type: "pending", deviceModelId },
      { type: "signed", signedOperation },
    ]);

    subscription.unsubscribe();
  });

  it("should normalize non Error bridge resolution failures", async () => {
    jest.mocked(getAccountBridge).mockRejectedValue("bridge failed");

    await expect(
      new Promise<void>((resolve, reject) => {
        startJob().subscribe({
          next: () => undefined,
          error: reject,
          complete: resolve,
        });
      }),
    ).rejects.toEqual(new Error("bridge failed"));
  });

  it("should ignore bridge resolution when unsubscribed before it completes", async () => {
    let resolveBridge: (bridge: BridgeMock) => void = () => undefined;
    const getBridgePromise = new Promise<BridgeMock>(resolve => {
      resolveBridge = resolve;
    });
    const bridge = createBridgeMock(of({ type: "signed", signedOperation }));
    jest
      .mocked(getAccountBridge)
      .mockReturnValue(getBridgePromise as unknown as ReturnType<typeof getAccountBridge>);

    const states: SignTransactionIntentJobState[] = [];
    const subscription = startJob().subscribe(state => states.push(state));

    subscription.unsubscribe();
    resolveBridge(bridge);
    await flushPromises();

    expect(states).toEqual([{ type: "pending", deviceModelId }]);
    expect(bridge.signOperation).not.toHaveBeenCalled();
  });
});
