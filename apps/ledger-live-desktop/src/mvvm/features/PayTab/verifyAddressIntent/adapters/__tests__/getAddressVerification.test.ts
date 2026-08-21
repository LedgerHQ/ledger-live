import { firstValueFrom, lastValueFrom, toArray } from "rxjs";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { DeviceConnectionResult } from "@features/platform-device-intent";
import type { VerifyAddressDeviceState } from "@features/platform-verify-address-intent";
import { getAddressVerification } from "../getAddressVerification";

jest.mock("@ledgerhq/live-dmk-shared", () => ({
  DmkCompatTransport: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/hw/getAddress/index", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const getAddress = jest.requireMock("@ledgerhq/live-common/hw/getAddress/index")
  .default as jest.Mock;

const ADDRESS = "0xAbC0000000000000000000000000000000000001";

const connection = {
  dmk: {},
  sessionId: "session-id",
} as unknown as DeviceConnectionResult;

function named(name: string, extra: Record<string, unknown> = {}): Error {
  return Object.assign(new Error(name), { name }, extra);
}

function collect(): Promise<VerifyAddressDeviceState[]> {
  return lastValueFrom(
    getAddressVerification(connection, {
      currency: { id: "ethereum" } as CryptoCurrency,
      path: "44'/60'/0'/0/0",
      derivationMode: "",
    }).observable.pipe(toArray()),
  );
}

describe("getAddressVerification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("emits the device address once the user confirms", async () => {
    getAddress.mockResolvedValue({ address: ADDRESS });

    await expect(collect()).resolves.toEqual([
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
      named("EthAppPleaseEnableContractData", {
        statusCode: 0x6985,
      }),
    ],
  ])("maps %s to refused so the intent can offer a retry", async (_label, error) => {
    getAddress.mockRejectedValue(error);

    await expect(collect()).resolves.toEqual([
      { type: "awaiting-confirmation" },
      { type: "refused" },
    ]);
  });

  it("maps DeviceAppVerifyNotSupported to unsupported", async () => {
    const error = named("DeviceAppVerifyNotSupported");
    getAddress.mockRejectedValue(error);

    await expect(collect()).resolves.toEqual([
      { type: "awaiting-confirmation" },
      { type: "unsupported", error },
    ]);
  });

  it("lets an unrelated transport status code escape as an observable error", async () => {
    const error = named("TransportStatusError", { statusCode: 0x6a80 });
    getAddress.mockRejectedValue(error);

    await expect(collect()).rejects.toBe(error);
  });

  it("stays silent once cancelled", async () => {
    let rejectGetAddress: (error: Error) => void = () => {};
    getAddress.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectGetAddress = reject;
      }),
    );

    const action = getAddressVerification(connection, {
      currency: { id: "ethereum" } as CryptoCurrency,
      path: "44'/60'/0'/0/0",
      derivationMode: "",
    });

    const next = jest.fn();
    const error = jest.fn();
    const first = firstValueFrom(action.observable);
    const subscription = action.observable.subscribe({ next, error });
    await expect(first).resolves.toEqual({ type: "awaiting-confirmation" });

    action.cancel();
    rejectGetAddress(named("UserRefusedOnDevice"));
    await Promise.resolve();

    expect(next).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
    subscription.unsubscribe();
  });
});
