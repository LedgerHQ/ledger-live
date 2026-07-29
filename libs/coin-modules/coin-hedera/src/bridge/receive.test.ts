import { WrongDeviceForAccount } from "@ledgerhq/ledger-wallet-framework/errors";
import { getMockedAccount } from "../test/fixtures/account.fixture";
import { receive } from "./receive";

const PUBLIC_KEY = "03a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3";

const buildGetAddress = (returnedPublicKey: string, rejectWith?: Error) =>
  jest.fn().mockImplementation(
    rejectWith !== undefined
      ? () => Promise.reject(rejectWith)
      : () =>
          Promise.resolve({
            publicKey: returnedPublicKey,
            address: returnedPublicKey,
            path: "44'/3030'/0'/0'/0'",
          }),
  );

type ObservableResult = { events: unknown[]; error?: unknown };

const collectObservable = (
  obs: ReturnType<ReturnType<typeof receive>>,
): Promise<ObservableResult> =>
  new Promise(resolve => {
    const events: unknown[] = [];
    obs.subscribe({
      next: v => events.push(v),
      complete: () => resolve({ events }),
      error: err => resolve({ events, error: err }),
    });
  });

describe("receive", () => {
  const account = getMockedAccount({
    seedIdentifier: PUBLIC_KEY,
    freshAddress: "0.0.12345",
    freshAddressPath: "44'/3030'/0'/0'/0'",
  });

  it("emits the account freshAddress and completes when publicKey matches seedIdentifier", async () => {
    const getAddress = buildGetAddress(PUBLIC_KEY);
    const receiveFn = receive(getAddress);

    const { events, error } = await collectObservable(receiveFn(account, { deviceId: "device-1" }));

    expect(error).toBeUndefined();
    expect(events).toEqual([
      {
        address: account.freshAddress,
        path: account.freshAddressPath,
        publicKey: PUBLIC_KEY,
      },
    ]);
  });

  it("errors with WrongDeviceForAccount when the returned publicKey does not match seedIdentifier", async () => {
    const getAddress = buildGetAddress("different-public-key");
    const receiveFn = receive(getAddress);

    const { events, error } = await collectObservable(receiveFn(account, { deviceId: "device-1" }));

    expect(error).toBeInstanceOf(WrongDeviceForAccount);
    expect(events).toEqual([]);
  });

  it("propagates getAddress errors to the Observable", async () => {
    const thrown = new Error("device disconnected");
    const getAddress = buildGetAddress("", thrown);
    const receiveFn = receive(getAddress);

    const { events, error } = await collectObservable(receiveFn(account, { deviceId: "device-1" }));

    expect(error).toBe(thrown);
    expect(events).toEqual([]);
  });

  it("calls getAddress with the correct derivation parameters", async () => {
    const getAddress = buildGetAddress(PUBLIC_KEY);
    const receiveFn = receive(getAddress);

    await collectObservable(receiveFn(account, { deviceId: "my-device" }));

    expect(getAddress).toHaveBeenCalledTimes(1);
    expect(getAddress).toHaveBeenCalledWith(
      "my-device",
      expect.objectContaining({
        path: account.freshAddressPath,
        currency: account.currency,
      }),
    );
  });
});
