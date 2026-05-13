import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import { Observable } from "rxjs";

const calls = {
  execute: [] as Array<{
    sessionId: string;
    deviceAction: unknown;
  }>,
  reset: 0,
};

function completedAction() {
  return {
    observable: new Observable(observer => {
      observer.next({ status: DeviceActionStatus.Completed, output: {} } as const);
      observer.complete();
    }),
    cancel: (): void => {},
  };
}

function errorAction(error: unknown) {
  return {
    observable: new Observable(observer => {
      observer.next({ status: DeviceActionStatus.Error, error } as const);
      observer.complete();
    }),
    cancel: (): void => {},
  };
}

const testTransport = {
  dmk: {
    _unsafeBypassIntentQueue: (): void => {},
    executeDeviceAction: ({
      sessionId,
      deviceAction,
    }: {
      sessionId: string;
      deviceAction: unknown;
    }) => {
      calls.execute.push({ sessionId, deviceAction });
      return executeImpl();
    },
    disconnect: async () => {
      calls.reset += 1;
    },
  },
  sessionId: "test-session-id",
};

let executeImpl: () => { observable: Observable<unknown>; cancel: () => void };

const { _setTestDmkTransport, disposeWalletCliDmkTransportFully } =
  await import("../device/register-dmk-transport");
const { WalletCliDeviceError } = await import("../device/wallet-cli-device-error");
const { getManagerAppNameForCurrencyId, withCurrencyDeviceSession } =
  await import("./bridge-device-session");

describe("withCurrencyDeviceSession", () => {
  beforeEach(async () => {
    _setTestDmkTransport(null);
    await disposeWalletCliDmkTransportFully();
    calls.execute = [];
    calls.reset = 0;
    executeImpl = () => completedAction();
    _setTestDmkTransport(testTransport as never);
  });

  afterEach(async () => {
    await disposeWalletCliDmkTransportFully();
    _setTestDmkTransport(null);
  });

  it("wraps setup failures as WalletCliDeviceError", async () => {
    const usbError = new Error("USB down");
    _setTestDmkTransport({
      get dmk() {
        throw usbError;
      },
      sessionId: "broken-session-id",
    } as never);

    await expect(withCurrencyDeviceSession("ethereum", async () => "ok")).rejects.toBeInstanceOf(
      WalletCliDeviceError,
    );
    expect(calls.execute).toHaveLength(0);
    expect(calls.reset).toBe(0);
  });

  it("wraps connect failures as WalletCliDeviceError", async () => {
    executeImpl = () => errorAction(new Error("connect failed"));

    await expect(withCurrencyDeviceSession("ethereum", async () => "ok")).rejects.toBeInstanceOf(
      WalletCliDeviceError,
    );
    expect(calls.execute).toHaveLength(1);
    expect(calls.reset).toBe(0);
  });

  it("rethrows callback failures unchanged after resetting the session", async () => {
    const callbackError = new Error("HTTP parsing bug");

    await expect(
      withCurrencyDeviceSession("ethereum", async () => {
        throw callbackError;
      }),
    ).rejects.toBe(callbackError);

    expect(calls.execute).toHaveLength(1);
    expect(calls.execute[0].sessionId).toBe(testTransport.sessionId);
    expect(
      (
        calls.execute[0].deviceAction as {
          input: { application: { name: string } };
        }
      ).input.application.name,
    ).toBe("Ethereum");
    expect(calls.reset).toBe(1);
  });

  it("resets the session after a successful callback", async () => {
    const result = await withCurrencyDeviceSession("bitcoin", async () => "done");

    expect(result).toBe("done");
    expect(calls.reset).toBe(1);
  });
});

describe("getManagerAppNameForCurrencyId", () => {
  it("returns the Ledger manager app name for currencies with dedicated apps", () => {
    expect(getManagerAppNameForCurrencyId("bitcoin")).toBe("Bitcoin");
    expect(getManagerAppNameForCurrencyId("ethereum")).toBe("Ethereum");
  });

  it("returns the shared manager app name for currencies reusing another app", () => {
    expect(getManagerAppNameForCurrencyId("base")).toBe("Ethereum");
  });
});
