/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { TransportStatusError } from "@ledgerhq/hw-transport/errors";
import {
  UserRefusedOnDevice,
  WrongDeviceForAccount,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { DeviceAppVerifyNotSupported, UserRefusedAddress } from "../../../errors";
import type { GetAddressResult } from "@ledgerhq/ledger-wallet-framework/derivation";
import { getMainAccount } from "../../../account/index";
import getAddress from "../../../hw/getAddress/index";
import type { DeviceConnectionResult, DeviceExtractedContext } from "@ledgerhq/device-intent";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { verifyAddressIntentJob } from "../job";
import type { VerifyAddressIntentInput, VerifyAddressIntentJobState } from "../types";

jest.mock("../../../account/index", () => ({
  getMainAccount: jest.fn(),
}));

jest.mock("../../../hw/getAddress/index", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@ledgerhq/live-dmk-shared", () => ({
  DmkCompatTransport: jest.fn().mockImplementation(() => ({})),
}));

const account = { id: "account-1" } as AccountLike;
const parentAccount = { id: "parent-account-1" } as Account;
const address = "0xabc";
const mainAccount = {
  id: "main-account-1",
  freshAddress: address,
  freshAddressPath: "44'/60'/0'/0/0",
  derivationMode: "",
  currency: { id: "ethereum", family: "evm" },
} as unknown as Account;

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

const input: VerifyAddressIntentInput = {
  account,
  parentAccount,
};

const getAddressResult: GetAddressResult = {
  address,
  path: "44'/60'/0'/0/0",
  publicKey: "04pubkey",
};

function mockGetAddress(factory: () => Promise<GetAddressResult>) {
  jest.mocked(getAddress).mockImplementation(factory);
}

function startJob() {
  return verifyAddressIntentJob({ deviceConnectionResult, deviceExtractedContext, input });
}

function collectStates(): Promise<VerifyAddressIntentJobState[]> {
  return new Promise((resolve, reject) => {
    const states: VerifyAddressIntentJobState[] = [];
    startJob().subscribe({
      next: state => states.push(state),
      error: reject,
      complete: () => resolve(states),
    });
  });
}

describe("verifyAddressIntentJob", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getMainAccount).mockReturnValue(mainAccount);
  });

  it("should verify the address and emit pending then verified", async () => {
    mockGetAddress(() => Promise.resolve(getAddressResult));

    const states = await collectStates();

    expect(getMainAccount).toHaveBeenCalledWith(account, parentAccount);
    expect(getAddress).toHaveBeenCalledWith(expect.anything(), {
      currency: mainAccount.currency,
      derivationMode: mainAccount.derivationMode,
      path: mainAccount.freshAddressPath,
      verify: true,
    });
    expect(states).toEqual([
      { type: "pending", deviceModelId, address },
      { type: "verified", address },
    ]);
  });

  it("should use the provided path override when present", async () => {
    mockGetAddress(() => Promise.resolve(getAddressResult));

    await new Promise<void>((resolve, reject) => {
      verifyAddressIntentJob({
        deviceConnectionResult,
        deviceExtractedContext,
        input: { ...input, path: "44'/60'/0'/0/1" },
      }).subscribe({ next: () => undefined, error: reject, complete: resolve });
    });

    expect(getAddress).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ path: "44'/60'/0'/0/1" }),
    );
  });

  it("should error with WrongDeviceForAccount when the address does not match", async () => {
    mockGetAddress(() => Promise.resolve({ ...getAddressResult, address: "0xother" }));

    await expect(collectStates()).rejects.toBeInstanceOf(WrongDeviceForAccount);
  });

  it("should emit unsupported when the device app cannot display the address", async () => {
    mockGetAddress(() => Promise.reject(new DeviceAppVerifyNotSupported()));

    const states = await collectStates();

    expect(states).toEqual([
      { type: "pending", deviceModelId, address },
      { type: "unsupported", error: expect.any(DeviceAppVerifyNotSupported) },
    ]);
  });

  it.each([
    ["UserRefusedAddress", () => new UserRefusedAddress()],
    ["UserRefusedOnDevice", () => new UserRefusedOnDevice()],
    ["TransportStatusError 0x6985", () => new TransportStatusError(0x6985)],
    ["TransportStatusError 0x5501", () => new TransportStatusError(0x5501)],
  ])("should emit a cancellable state when the user refuses (%s)", async (_label, makeError) => {
    jest.mocked(getAddress).mockImplementation(() => Promise.reject(makeError()));

    const states: VerifyAddressIntentJobState[] = [];
    const subscription = startJob().subscribe(state => states.push(state));

    await Promise.resolve();
    await Promise.resolve();

    expect(states).toEqual([
      { type: "pending", deviceModelId, address },
      { type: "cancelled", retry: expect.any(Function) },
    ]);

    subscription.unsubscribe();
  });

  it("should retry verification when a cancelled state retry is called", async () => {
    jest
      .mocked(getAddress)
      .mockImplementationOnce(() => Promise.reject(new UserRefusedAddress()))
      .mockImplementationOnce(() => Promise.resolve(getAddressResult));

    const states: VerifyAddressIntentJobState[] = [];
    const subscription = startJob().subscribe(state => states.push(state));

    await Promise.resolve();
    await Promise.resolve();

    const cancelledState = states[1];
    if (cancelledState?.type !== "cancelled") {
      throw new Error("Expected cancelled state");
    }

    cancelledState.retry();
    await Promise.resolve();
    await Promise.resolve();

    expect(getAddress).toHaveBeenCalledTimes(2);
    expect(states).toEqual([
      { type: "pending", deviceModelId, address },
      { type: "cancelled", retry: expect.any(Function) },
      { type: "pending", deviceModelId, address },
      { type: "verified", address },
    ]);

    subscription.unsubscribe();
  });

  it("should normalize non Error failures", async () => {
    jest.mocked(getAddress).mockImplementation(() => Promise.reject("verify failed"));

    await expect(collectStates()).rejects.toEqual(new Error("verify failed"));
  });
});
