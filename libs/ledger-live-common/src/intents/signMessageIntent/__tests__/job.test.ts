/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { TransportStatusError } from "@ledgerhq/hw-transport/errors";
import { UserRefusedAddress, UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { getMainAccount } from "../../../account/index";
import { signMessageExec } from "../../../hw/signMessage/index";
import type { Result } from "../../../hw/signMessage/types";
import type { DeviceConnectionResult, DeviceExtractedContext } from "@ledgerhq/device-intent";
import type { Account, AccountLike, AnyMessage } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Observable, of, throwError } from "rxjs";
import { signMessageIntentJob } from "../job";
import type { SignMessageIntentInput, SignMessageIntentJobState } from "../types";

jest.mock("../../../account/index", () => ({
  getMainAccount: jest.fn(),
}));

jest.mock("../../../hw/signMessage/index", () => ({
  signMessageExec: jest.fn(),
}));

const account = { id: "account-1" } as AccountLike;
const parentAccount = { id: "parent-account-1" } as Account;
const mainAccount = { id: "main-account-1" } as Account;
const message = { message: "hello" } as AnyMessage;
const result: Result = { signature: "0xsignature" };

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

const input: SignMessageIntentInput = {
  account,
  parentAccount,
  message,
};

function mockSignMessageExec(result$: Observable<Result>) {
  jest.mocked(signMessageExec).mockReturnValue(result$);
}

function startJob() {
  return signMessageIntentJob({ deviceConnectionResult, deviceExtractedContext, input });
}

describe("signMessageIntentJob", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getMainAccount).mockReturnValue(mainAccount);
  });

  it("should sign the message with the main account and emit pending then signed", async () => {
    mockSignMessageExec(of(result));

    const states = await new Promise<SignMessageIntentJobState[]>((resolve, reject) => {
      const emittedStates: SignMessageIntentJobState[] = [];
      startJob().subscribe({
        next: state => emittedStates.push(state),
        error: reject,
        complete: () => resolve(emittedStates),
      });
    });

    expect(getMainAccount).toHaveBeenCalledWith(account, parentAccount);
    expect(signMessageExec).toHaveBeenCalledWith({
      request: { account: mainAccount, message },
      deviceId: "device-1",
    });
    expect(states).toEqual([
      { type: "pending", deviceModelId },
      { type: "signed", signature: "0xsignature" },
    ]);
  });

  it.each([
    ["UserRefusedOnDevice", () => new UserRefusedOnDevice()],
    ["UserRefusedAddress", () => new UserRefusedAddress()],
    ["TransportStatusError 0x6985", () => new TransportStatusError(0x6985)],
    ["TransportStatusError 0x5501", () => new TransportStatusError(0x5501)],
  ])("should emit a cancellable state when the user refuses (%s)", async (_label, makeError) => {
    mockSignMessageExec(throwError(makeError));

    const states: SignMessageIntentJobState[] = [];
    const subscription = startJob().subscribe(state => states.push(state));

    expect(states).toEqual([
      { type: "pending", deviceModelId },
      { type: "cancelled", retry: expect.any(Function) },
    ]);

    subscription.unsubscribe();
  });

  it("should retry signing when a cancelled state retry is called", async () => {
    jest
      .mocked(signMessageExec)
      .mockReturnValueOnce(throwError(() => new UserRefusedOnDevice()))
      .mockReturnValueOnce(of(result));

    const states: SignMessageIntentJobState[] = [];
    const subscription = startJob().subscribe(state => states.push(state));

    const cancelledState = states[1];
    if (cancelledState?.type !== "cancelled") {
      throw new Error("Expected cancelled state");
    }

    cancelledState.retry();

    expect(signMessageExec).toHaveBeenCalledTimes(2);
    expect(states).toEqual([
      { type: "pending", deviceModelId },
      { type: "cancelled", retry: expect.any(Function) },
      { type: "pending", deviceModelId },
      { type: "signed", signature: "0xsignature" },
    ]);

    subscription.unsubscribe();
  });

  it("should normalize non Error signing failures", async () => {
    mockSignMessageExec(throwError(() => "sign failed"));

    await expect(
      new Promise<void>((resolve, reject) => {
        startJob().subscribe({
          next: () => undefined,
          error: reject,
          complete: resolve,
        });
      }),
    ).rejects.toEqual(new Error("sign failed"));
  });
});
