/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { TransportStatusError } from "@ledgerhq/hw-transport/errors";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getMainAccount } from "../../../account/index";
import { getAccountBridge } from "../../../bridge/index";
import type {
  DeviceConnectionResult,
  DeviceExtractedContext,
} from "@features/platform-device-intent";
import type {
  Account,
  AccountLike,
  SignOperationEvent,
  SignedOperation,
} from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceModelId as DMKDeviceModelId } from "@ledgerhq/device-management-kit";
import { Observable, of, throwError } from "rxjs";
import { signRawTransactionIntentJob } from "../job";
import type { SignRawTransactionIntentInput, SignRawTransactionIntentJobState } from "../types";

jest.mock("../../../account/index", () => ({
  getMainAccount: jest.fn(),
}));

jest.mock("../../../bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));

const account = { id: "token-account-1" } as AccountLike;
const parentAccount = { id: "parent-account-1" } as Account;
const mainAccount = {
  id: "main-account-1",
  currency: getCryptoCurrencyById("tron"),
} as Account;
const signedOperation = { operation: { id: "operation-1" } } as SignedOperation;
const deviceModelId = DeviceModelId.nanoX;

const deviceConnectionResult: DeviceConnectionResult = {
  dmk: null as unknown as DeviceConnectionResult["dmk"],
  sessionId: "session-1",
  connectedDevice: {
    modelId: DMKDeviceModelId.NANO_X,
  } as DeviceConnectionResult["connectedDevice"],
  compatDeviceId: "device-1",
  compatDeviceName: "Device 1",
  compatDeviceWired: true,
};

const deviceExtractedContext: DeviceExtractedContext = {
  currentOsVersion: "1.0.0",
  osUpdateAvailable: false,
  currentAppName: "Tron",
  currentAppVersion: "1.0.0",
};

const input: SignRawTransactionIntentInput = {
  account,
  parentAccount,
  transaction: "0a02abcd",
};

function mockBridge(events$: Observable<SignOperationEvent>) {
  const bridge = {
    signOperation: jest.fn(),
    signRawOperation: jest.fn((_params: unknown) => events$),
  };
  jest
    .mocked(getAccountBridge)
    .mockResolvedValue(bridge as unknown as Awaited<ReturnType<typeof getAccountBridge>>);
  return bridge;
}

function collectStates() {
  const states: SignRawTransactionIntentJobState[] = [];
  let error: unknown = null;
  const subscription = signRawTransactionIntentJob({
    deviceConnectionResult,
    deviceExtractedContext,
    input,
    onResult: jest.fn(),
  }).subscribe({
    next: state => states.push(state),
    error: e => {
      error = e;
    },
  });
  return { states, getError: () => error, subscription };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("signRawTransactionIntentJob", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getMainAccount).mockReturnValue(mainAccount);
  });

  it("raw-signs the hex with the main account", async () => {
    const bridge = mockBridge(of({ type: "signed", signedOperation }));

    const { states } = collectStates();
    await flushPromises();

    expect(getMainAccount).toHaveBeenCalledWith(account, parentAccount);
    expect(bridge.signRawOperation).toHaveBeenCalledWith({
      account: mainAccount,
      transaction: "0a02abcd",
      deviceId: "device-1",
      deviceModelId,
    });
    expect(bridge.signOperation).not.toHaveBeenCalled();
    expect(states).toEqual([
      { type: "pending", deviceModelId },
      { type: "signed", signedOperation },
    ]);
  });

  it("turns a refusal into a cancelled state whose retry signs again", async () => {
    const bridge = mockBridge(of({ type: "signed", signedOperation }));
    bridge.signRawOperation.mockReturnValueOnce(throwError(() => new TransportStatusError(0x6985)));

    const { states, subscription } = collectStates();
    await flushPromises();
    const cancelled = states[1];
    if (cancelled?.type !== "cancelled") throw new Error("Expected cancelled state");
    cancelled.retry();
    await flushPromises();

    expect(bridge.signRawOperation).toHaveBeenCalledTimes(2);
    expect(states.at(-1)).toEqual({ type: "signed", signedOperation });
    subscription.unsubscribe();
  });

  it("errors on any other device status, so the consumer's onIntentJobError sees it", async () => {
    const contractDataRefused = new TransportStatusError(0x6a80);
    mockBridge(throwError(() => contractDataRefused));

    const { states, getError } = collectStates();
    await flushPromises();

    expect(states).toEqual([{ type: "pending", deviceModelId }]);
    expect(getError()).toBe(contractDataRefused);
  });
});
