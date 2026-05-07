import { beforeEach, describe, expect, it, mock } from "bun:test";
import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import { Observable } from "rxjs";

const calls = {
  ensure: 0,
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
  },
  sessionId: "test-session-id",
};

let ensureImpl: () => Promise<typeof testTransport>;
let executeImpl: () => { observable: Observable<unknown>; cancel: () => void };
let resetImpl: () => Promise<void>;

mock.module("../device/register-dmk-transport", () => {
  let _leakedTestTransport: unknown = null;
  return {
    WALLET_CLI_DMK_DEVICE_ID: "wallet-cli-dmk",
    // Allow cli-runner (running in a worker that received the leaked mock) to
    // install a test transport so DMK-dependent commands still work.
    _setTestDmkTransport: (t: unknown) => {
      _leakedTestTransport = t;
    },
    ensureWalletCliDmkTransport: async () => {
      if (_leakedTestTransport) return _leakedTestTransport;
      calls.ensure += 1;
      return ensureImpl();
    },
    resetWalletCliDmkSession: async () => {
      calls.reset += 1;
      return resetImpl();
    },
    disposeWalletCliDmkTransportFully: async () => {},
    registerWalletCliDmkTransport: () => {},
  };
});

const { WalletCliDeviceError } = await import("../device/wallet-cli-device-error");
const { getManagerAppNameForCurrencyId, withCurrencyDeviceSession } =
  await import("./bridge-device-session");

describe("withCurrencyDeviceSession", () => {
  beforeEach(() => {
    calls.ensure = 0;
    calls.execute = [];
    calls.reset = 0;
    ensureImpl = async () => testTransport;
    executeImpl = () => completedAction();
    resetImpl = async () => {};
  });

  it("wraps setup failures as WalletCliDeviceError", async () => {
    const usbError = new Error("USB down");
    ensureImpl = async () => {
      throw usbError;
    };

    await expect(withCurrencyDeviceSession("ethereum", async () => "ok")).rejects.toBeInstanceOf(
      WalletCliDeviceError,
    );
    expect(calls.ensure).toBe(1);
    expect(calls.execute).toHaveLength(0);
    expect(calls.reset).toBe(0);
  });

  it("wraps connect failures as WalletCliDeviceError", async () => {
    executeImpl = () => errorAction(new Error("connect failed"));

    await expect(withCurrencyDeviceSession("ethereum", async () => "ok")).rejects.toBeInstanceOf(
      WalletCliDeviceError,
    );
    expect(calls.ensure).toBe(1);
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
