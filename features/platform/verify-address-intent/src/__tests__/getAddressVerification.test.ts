import { firstValueFrom, lastValueFrom, toArray } from "rxjs";
import type { VerifyAddressDeviceState } from "../types";
import { getAddressVerification } from "../getAddressVerification";

const ADDRESS = "0xAbC0000000000000000000000000000000000001";

function named(name: string, extra: Record<string, unknown> = {}): Error {
  return Object.assign(new Error(name), { name }, extra);
}

function collect(verify: () => Promise<{ address: string }>): Promise<VerifyAddressDeviceState[]> {
  return lastValueFrom(getAddressVerification(verify).observable.pipe(toArray()));
}

describe("getAddressVerification", () => {
  it("emits the device address once the user confirms", async () => {
    await expect(collect(async () => ({ address: ADDRESS }))).resolves.toEqual([
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
    await expect(collect(async () => Promise.reject(error))).resolves.toEqual([
      { type: "awaiting-confirmation" },
      { type: "refused" },
    ]);
  });

  it("maps DeviceAppVerifyNotSupported to unsupported", async () => {
    const error = named("DeviceAppVerifyNotSupported");

    await expect(collect(async () => Promise.reject(error))).resolves.toEqual([
      { type: "awaiting-confirmation" },
      { type: "unsupported", error },
    ]);
  });

  it("lets an unrelated transport status code escape as an observable error", async () => {
    const error = named("TransportStatusError", { statusCode: 0x6a80 });

    await expect(collect(async () => Promise.reject(error))).rejects.toBe(error);
  });

  it("stays silent once cancelled", async () => {
    let rejectVerify: (error: Error) => void = () => {};
    const verify = () =>
      new Promise<{ address: string }>((_resolve, reject) => {
        rejectVerify = reject;
      });

    const action = getAddressVerification(verify);
    const next = jest.fn();
    const error = jest.fn();
    const first = firstValueFrom(action.observable);
    const subscription = action.observable.subscribe({ next, error });
    await expect(first).resolves.toEqual({ type: "awaiting-confirmation" });

    action.cancel();
    rejectVerify(named("UserRefusedOnDevice"));
    await Promise.resolve();

    expect(next).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
    subscription.unsubscribe();
  });
});
