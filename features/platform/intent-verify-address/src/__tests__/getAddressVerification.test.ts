import { lastValueFrom, toArray } from "rxjs";
import type { VerifyAddressDeviceState } from "../types";
import { getAddressVerification, type VerifyAddressOnDevice } from "../getAddressVerification";

const ADDRESS = "0xAbC0000000000000000000000000000000000001";

function named(name: string, extra: Record<string, unknown> = {}): Error {
  return Object.assign(new Error(name), { name }, extra);
}

function collect(verify: VerifyAddressOnDevice): Promise<VerifyAddressDeviceState[]> {
  return lastValueFrom(getAddressVerification(verify).observable.pipe(toArray()));
}

function rejectAfterDeviceRequest(error: Error): VerifyAddressOnDevice {
  return async onDeviceRequest => {
    onDeviceRequest();
    throw error;
  };
}

function controllableVerify() {
  const pending: { onDeviceRequest?: () => void; reject?: (error: Error) => void } = {};
  const verify: VerifyAddressOnDevice = onDeviceRequest =>
    new Promise((_resolve, reject) => {
      pending.onDeviceRequest = onDeviceRequest;
      pending.reject = reject;
    });

  return {
    verify,
    startDeviceRequest: () => pending.onDeviceRequest?.(),
    reject: (error: Error) => pending.reject?.(error),
  };
}

function subscribeTo(verify: VerifyAddressOnDevice) {
  const action = getAddressVerification(verify);
  const states: VerifyAddressDeviceState[] = [];
  const error = jest.fn();
  const subscription = action.observable.subscribe({
    next: state => states.push(state),
    error,
  });

  return { action, states, error, subscription };
}

describe("getAddressVerification", () => {
  it("emits nothing until the host reports the device request", () => {
    const { verify } = controllableVerify();
    const { states, subscription } = subscribeTo(verify);

    expect(states).toEqual([]);
    subscription.unsubscribe();
  });

  it("emits awaiting-confirmation once, even when the device request is reported twice", () => {
    const { verify, startDeviceRequest } = controllableVerify();
    const { states, subscription } = subscribeTo(verify);

    startDeviceRequest();
    startDeviceRequest();

    expect(states).toEqual([{ type: "awaiting-confirmation" }]);
    subscription.unsubscribe();
  });

  it("emits the device address once the user confirms", async () => {
    const verify: VerifyAddressOnDevice = async onDeviceRequest => {
      onDeviceRequest();
      return { address: ADDRESS };
    };

    await expect(collect(verify)).resolves.toEqual([
      { type: "awaiting-confirmation" },
      { type: "confirmed", address: ADDRESS },
    ]);
  });

  it.each([
    ["UserRefusedAddress (legacy signer)", named("UserRefusedAddress")],
    ["UserRefusedOnDevice (DMK-native signer)", named("UserRefusedOnDevice")],
    ["TransportStatusError 0x6985", named("TransportStatusError", { statusCode: 0x6985 })],
    ["TransportStatusError 0x5501", named("TransportStatusError", { statusCode: 0x5501 })],
    [
      "a refusal status code carried by any other error",
      named("EthAppPleaseEnableContractData", { statusCode: 0x6985 }),
    ],
  ])("maps %s to refused so the intent can offer a retry", async (_label, error) => {
    await expect(collect(rejectAfterDeviceRequest(error))).resolves.toEqual([
      { type: "awaiting-confirmation" },
      { type: "refused" },
    ]);
  });

  it("maps DeviceAppVerifyNotSupported to unsupported", async () => {
    const error = named("DeviceAppVerifyNotSupported");

    await expect(collect(rejectAfterDeviceRequest(error))).resolves.toEqual([
      { type: "awaiting-confirmation" },
      { type: "unsupported", error },
    ]);
  });

  it("reports unsupported without awaiting-confirmation when it fails before any device request", async () => {
    const error = named("DeviceAppVerifyNotSupported");

    await expect(collect(async () => Promise.reject(error))).resolves.toEqual([
      { type: "unsupported", error },
    ]);
  });

  it("lets an unrelated transport status code escape as an observable error", async () => {
    const error = named("TransportStatusError", { statusCode: 0x6a80 });

    await expect(collect(rejectAfterDeviceRequest(error))).rejects.toBe(error);
  });

  it("stays silent once cancelled", async () => {
    const { verify, startDeviceRequest, reject } = controllableVerify();
    const { action, states, error, subscription } = subscribeTo(verify);
    startDeviceRequest();
    expect(states).toEqual([{ type: "awaiting-confirmation" }]);

    action.cancel();
    reject(named("UserRefusedOnDevice"));
    await Promise.resolve();

    expect(states).toEqual([{ type: "awaiting-confirmation" }]);
    expect(error).not.toHaveBeenCalled();
    subscription.unsubscribe();
  });

  it("ignores a device request reported after cancel", () => {
    const { verify, startDeviceRequest } = controllableVerify();
    const { action, states, subscription } = subscribeTo(verify);

    action.cancel();
    startDeviceRequest();

    expect(states).toEqual([]);
    subscription.unsubscribe();
  });

  it("ignores a device request reported after unsubscribe", () => {
    const { verify, startDeviceRequest } = controllableVerify();
    const { states, subscription } = subscribeTo(verify);

    subscription.unsubscribe();
    startDeviceRequest();

    expect(states).toEqual([]);
  });
});
