import type { VerifyAddressDeviceState } from "@features/platform-intent-verify-address";
import {
  ACCOUNT,
  ADDRESS,
  GET_ADDRESS_APDU,
  GET_APP_AND_VERSION_APDU,
  SELECTION,
  fakeDevice,
  fakePorts,
} from "../__tests__/verifyAddressPorts";
import {
  buildVerifyAddressIntentInput,
  type VerifyAddressDeviceListeners,
} from "./buildVerifyAddressIntentInput";

const OPTIONS = { path: "44'/60'/0'/0/0" };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });

  return { promise, resolve };
}

function startVerification(ports = fakePorts(), listeners?: VerifyAddressDeviceListeners) {
  const input = buildVerifyAddressIntentInput(ACCOUNT, SELECTION.verification, ports, listeners)!;
  const { connection, sendApdu } = fakeDevice();
  const { observable, cancel } = input.startAddressVerification(connection);
  const states: VerifyAddressDeviceState[] = [];
  const error = jest.fn();
  const subscription = observable.subscribe({ next: state => states.push(state), error });

  return { cancel, connection, error, sendApdu, states, subscription };
}

const flushPromises = () => new Promise(resolve => setTimeout(resolve));

function askThroughApdus(apdus: readonly Uint8Array[], listeners?: VerifyAddressDeviceListeners) {
  const gate = deferred<void>();
  const ports = fakePorts({
    getAddress: jest.fn(async ({ dmk, sessionId }) => {
      for (const [index, apdu] of apdus.entries()) {
        if (index > 0) await gate.promise;
        await dmk.sendApdu({ sessionId, apdu });
      }
      return { address: ADDRESS };
    }),
  });

  return { ...startVerification(ports, listeners), releaseNextApdu: gate.resolve };
}

describe("buildVerifyAddressIntentInput", () => {
  it("should expect the address the device derives and shows", () => {
    const input = buildVerifyAddressIntentInput(ACCOUNT, SELECTION.verification, fakePorts());

    expect(input?.expectedAddress).toBe(ADDRESS);
  });

  it("should build no input when the device cannot confirm the address", () => {
    expect(buildVerifyAddressIntentInput(ACCOUNT, undefined, fakePorts())).toBeUndefined();
  });

  it("should ask the device to show the address with the options read for the account", async () => {
    const ports = fakePorts();
    const { connection, states, subscription } = startVerification(ports);

    await flushPromises();

    expect(ports.getAddressOptions).toHaveBeenCalledWith(ACCOUNT, SELECTION.verification);
    expect(ports.getAddress).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: connection.sessionId }),
      OPTIONS,
    );
    expect(states).toEqual([{ type: "confirmed", address: ADDRESS }]);
    subscription.unsubscribe();
  });

  it("should report each attempt the job starts", () => {
    const onAttemptStart = jest.fn();
    const input = buildVerifyAddressIntentInput(ACCOUNT, SELECTION.verification, fakePorts(), {
      onAttemptStart,
    })!;
    const { connection } = fakeDevice();

    input.startAddressVerification(connection);
    input.startAddressVerification(connection);

    expect(onAttemptStart).toHaveBeenCalledTimes(2);
  });

  it("should report the device request on the first APDU that is not the app-and-version query", async () => {
    const { releaseNextApdu, states, subscription } = askThroughApdus([
      GET_APP_AND_VERSION_APDU,
      GET_ADDRESS_APDU,
    ]);

    await flushPromises();
    expect(states).toEqual([]);

    releaseNextApdu();
    await flushPromises();

    expect(states).toEqual([
      { type: "awaiting-confirmation" },
      { type: "confirmed", address: ADDRESS },
    ]);
    subscription.unsubscribe();
  });

  it("should report the address displayed once the device request is sent, not before", async () => {
    const onAddressDisplayed = jest.fn();
    const { releaseNextApdu, subscription } = askThroughApdus(
      [GET_APP_AND_VERSION_APDU, GET_ADDRESS_APDU],
      { onAddressDisplayed },
    );

    await flushPromises();
    expect(onAddressDisplayed).not.toHaveBeenCalled();

    releaseNextApdu();
    await flushPromises();

    expect(onAddressDisplayed).toHaveBeenCalledTimes(1);
    subscription.unsubscribe();
  });

  describe("when the verification is cancelled", () => {
    it("should not start the device request that was still being prepared", async () => {
      const options = deferred<typeof OPTIONS>();
      const ports = fakePorts({ getAddressOptions: jest.fn(() => options.promise) });
      const { cancel, error, states, subscription } = startVerification(ports);

      cancel();
      options.resolve(OPTIONS);
      await flushPromises();

      expect(ports.getAddress).not.toHaveBeenCalled();
      expect(states).toEqual([]);
      expect(error).not.toHaveBeenCalled();
      subscription.unsubscribe();
    });

    it("should stop the signer before its first request reaches the device", async () => {
      const gate = deferred<void>();
      const signerError = jest.fn();
      const ports = fakePorts({
        getAddress: jest.fn(async ({ dmk, sessionId }) => {
          await dmk.sendApdu({ sessionId, apdu: GET_APP_AND_VERSION_APDU });
          await gate.promise;
          try {
            await dmk.sendApdu({ sessionId, apdu: GET_ADDRESS_APDU });
          } catch (error) {
            signerError(error);
            throw error;
          }
          return { address: ADDRESS };
        }),
      });
      const { cancel, error, sendApdu, states, subscription } = startVerification(ports);
      await flushPromises();
      expect(sendApdu).toHaveBeenCalledTimes(1);

      cancel();
      gate.resolve();
      await flushPromises();

      expect(signerError).toHaveBeenCalledWith(
        expect.objectContaining({ name: "DeviceRequestAbortedError" }),
      );
      expect(sendApdu).toHaveBeenCalledTimes(1);
      expect(states).toEqual([]);
      expect(error).not.toHaveBeenCalled();
      subscription.unsubscribe();
    });

    it("should let a signer that started on the device show the address, like Bitcoin after its silent requests", async () => {
      const silentRequests = [GET_ADDRESS_APDU, GET_ADDRESS_APDU, GET_ADDRESS_APDU];
      const gate = deferred<void>();
      const ports = fakePorts({
        getAddress: jest.fn(async ({ dmk, sessionId }) => {
          await dmk.sendApdu({ sessionId, apdu: silentRequests[0] });
          await gate.promise;
          for (const apdu of silentRequests.slice(1)) await dmk.sendApdu({ sessionId, apdu });
          await dmk.sendApdu({ sessionId, apdu: GET_ADDRESS_APDU });
          return { address: ADDRESS };
        }),
      });
      const { cancel, error, sendApdu, states, subscription } = startVerification(ports);
      await flushPromises();

      cancel();
      gate.resolve();
      await flushPromises();

      expect(sendApdu).toHaveBeenCalledTimes(silentRequests.length + 1);
      expect(states).toEqual([{ type: "awaiting-confirmation" }]);
      expect(error).not.toHaveBeenCalled();
      subscription.unsubscribe();
    });
  });
});
