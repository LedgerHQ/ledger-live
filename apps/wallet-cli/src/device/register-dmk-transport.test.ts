import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import {
  DeviceModelId as DmkDeviceModelId,
  DeviceStatus,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import {
  disconnect as disconnectTransport,
  open as openTransport,
} from "@ledgerhq/live-common/hw/index";
import { DeviceModelId as LedgerDeviceModelId } from "@ledgerhq/types-devices";
import { of } from "rxjs";

let createDeviceManagementKitImpl: () => Promise<{
  dmk: DeviceManagementKit;
  destroyTransport: () => Promise<void>;
}>;

type Deferred<T = void> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

mock.module("./dmk", () => ({
  createDeviceManagementKit: () => createDeviceManagementKitImpl(),
}));

const {
  WALLET_CLI_DMK_DEVICE_ID,
  _setTestDmkTransport,
  disposeWalletCliDmkTransportFully,
  ensureWalletCliDmkTransport,
  getWalletCliDeviceModelId,
  registerWalletCliDmkTransport,
  resetWalletCliDmkSession,
} = await import("./register-dmk-transport");

function deferred<T = void>(): Deferred<T> {
  let resolve!: Deferred<T>["resolve"];
  let reject!: Deferred<T>["reject"];
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function waitOneTick(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
}

function makeDmk({
  availableDevices = [{ id: "ledger-usb-1" }],
  close = () => {},
  connect,
  destroyTransport = async () => {},
  disconnect = async () => {},
  getSessionState = () => ({}),
}: {
  availableDevices?: { id: string }[];
  close?: () => void;
  connect?: (input: unknown) => Promise<string>;
  destroyTransport?: () => Promise<void>;
  disconnect?: (input: unknown) => Promise<void>;
  getSessionState?: () => unknown;
} = {}) {
  let nextSessionIndex = 0;
  const dmk = {
    listenToAvailableDevices: () => of(availableDevices),
    connect:
      connect ??
      (async () => {
        nextSessionIndex += 1;
        return `session-${nextSessionIndex}`;
      }),
    getDeviceSessionState: () => of(getSessionState()),
    disconnect,
    close,
  } as unknown as DeviceManagementKit;

  return {
    dmk,
    kit: {
      dmk,
      destroyTransport,
    },
  };
}

function makeTestTransport(sessionState?: unknown) {
  const dmk = {
    getDeviceSessionState: () => of(sessionState ?? {}),
    disconnect: async () => {},
  } as unknown as DeviceManagementKit;

  return {
    transport: {
      dmk,
      sessionId: "test-session-1",
      close: async () => {},
    },
  };
}

beforeEach(async () => {
  _setTestDmkTransport(null);
  await disposeWalletCliDmkTransportFully();
});

afterEach(async () => {
  await disposeWalletCliDmkTransportFully();
  _setTestDmkTransport(null);
});

describe("ensureWalletCliDmkTransport", () => {
  it("reuses the same transport until the caller resets the session", async () => {
    const fake = makeDmk();
    createDeviceManagementKitImpl = async () => fake.kit;

    const first = await ensureWalletCliDmkTransport();
    const second = await ensureWalletCliDmkTransport();
    await resetWalletCliDmkSession();
    const afterReset = await ensureWalletCliDmkTransport();

    expect(first).toBe(second);
    expect(first.sessionId).toBe("session-1");
    expect(afterReset).not.toBe(first);
    expect(afterReset.sessionId).toBe("session-2");
  });

  it("resets persistent DMK state after a discovery miss so the next ensure can retry", async () => {
    const destroyFirstTransport = mock(async () => {});
    const closeFirstDmk = mock(() => {});
    const first = makeDmk({
      availableDevices: [],
      close: closeFirstDmk,
      destroyTransport: destroyFirstTransport,
    });
    const second = makeDmk();
    const createDeviceManagementKit = mock(async () => {
      if (createDeviceManagementKit.mock.calls.length === 1) {
        return first.kit;
      }
      return second.kit;
    });
    createDeviceManagementKitImpl = createDeviceManagementKit;

    await expect(ensureWalletCliDmkTransport()).rejects.toThrow(
      "No Ledger device found. Unlock the device and try again.",
    );
    expect(destroyFirstTransport).toHaveBeenCalledTimes(1);
    expect(closeFirstDmk).toHaveBeenCalledTimes(1);

    await expect(ensureWalletCliDmkTransport()).resolves.toMatchObject({
      sessionId: "session-1",
    });
    expect(createDeviceManagementKit).toHaveBeenCalledTimes(2);
  });

  it("resets persistent DMK state when creating DMK fails so the next ensure can retry", async () => {
    const second = makeDmk();
    const createDeviceManagementKit = mock(async () => {
      if (createDeviceManagementKit.mock.calls.length === 1) {
        throw new Error("failed to create DMK");
      }
      return second.kit;
    });
    createDeviceManagementKitImpl = createDeviceManagementKit;

    await expect(ensureWalletCliDmkTransport()).rejects.toThrow("failed to create DMK");
    await expect(ensureWalletCliDmkTransport()).resolves.toMatchObject({
      sessionId: "session-1",
    });
    expect(createDeviceManagementKit).toHaveBeenCalledTimes(2);
  });

  it("resets persistent DMK state after a connect failure so the next ensure can retry", async () => {
    const destroyFirstTransport = mock(async () => {});
    const closeFirstDmk = mock(() => {});
    const first = makeDmk({
      close: closeFirstDmk,
      connect: mock(async () => {
        throw new Error("USB connect failed");
      }),
      destroyTransport: destroyFirstTransport,
    });
    const second = makeDmk();
    const createDeviceManagementKit = mock(async () => {
      if (createDeviceManagementKit.mock.calls.length === 1) {
        return first.kit;
      }
      return second.kit;
    });
    createDeviceManagementKitImpl = createDeviceManagementKit;

    await expect(ensureWalletCliDmkTransport()).rejects.toThrow("USB connect failed");
    expect(destroyFirstTransport).toHaveBeenCalledTimes(1);
    expect(closeFirstDmk).toHaveBeenCalledTimes(1);

    await expect(ensureWalletCliDmkTransport()).resolves.toMatchObject({
      sessionId: "session-1",
    });
    expect(createDeviceManagementKit).toHaveBeenCalledTimes(2);
  });

  it("asks the user to retry when the initial session is busy", async () => {
    let sessionState: unknown = { deviceStatus: DeviceStatus.BUSY };
    const disconnect = mock(async () => {});
    const fake = makeDmk({ disconnect, getSessionState: () => sessionState });
    createDeviceManagementKitImpl = async () => fake.kit;

    await expect(ensureWalletCliDmkTransport()).rejects.toThrow(
      "The Ledger device did not respond to the initial ping",
    );
    expect(disconnect).toHaveBeenCalledWith({ sessionId: "session-1" });

    sessionState = {};
    await expect(ensureWalletCliDmkTransport()).resolves.toMatchObject({
      sessionId: "session-2",
    });
  });

  it("shares one in-flight connection across concurrent ensure calls", async () => {
    const connectStarted = deferred();
    const finishConnect = deferred();
    const connect = mock(async () => {
      connectStarted.resolve();
      await finishConnect.promise;
      return "session-1";
    });
    const fake = makeDmk({ connect });
    const createDeviceManagementKit = mock(async () => fake.kit);
    createDeviceManagementKitImpl = createDeviceManagementKit;

    const firstPromise = ensureWalletCliDmkTransport();
    const secondPromise = ensureWalletCliDmkTransport();
    await connectStarted.promise;
    finishConnect.resolve();

    const [first, second] = await Promise.all([firstPromise, secondPromise]);
    expect(first).toBe(second);
    expect(createDeviceManagementKit).toHaveBeenCalledTimes(1);
    expect(connect).toHaveBeenCalledTimes(1);
  });
});

describe("teardown", () => {
  it("fully awaits destroyTransport when resetting an active DMK session", async () => {
    const finishDestroy = deferred();
    const destroyTransport = mock(async () => {
      await finishDestroy.promise;
    });
    const fake = makeDmk({ destroyTransport });
    createDeviceManagementKitImpl = async () => fake.kit;
    await ensureWalletCliDmkTransport();

    const realSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = ((handler: TimerHandler, _timeout?: number, ...args: unknown[]) =>
      realSetTimeout(handler, 0, ...args)) as typeof globalThis.setTimeout;

    let resetSettled = false;
    const resetPromise = resetWalletCliDmkSession().then(() => {
      resetSettled = true;
    });
    try {
      await waitOneTick();
      expect(resetSettled).toBe(false);
      finishDestroy.resolve();
      await resetPromise;
      expect(destroyTransport).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.setTimeout = realSetTimeout;
    }
  });

  it("bounds destroyTransport when disposing an active DMK session", async () => {
    const destroyTransport = mock(async () => {
      await new Promise(() => {});
    });
    const fake = makeDmk({ destroyTransport });
    createDeviceManagementKitImpl = async () => fake.kit;
    await ensureWalletCliDmkTransport();

    const realSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = ((handler: TimerHandler, _timeout?: number, ...args: unknown[]) =>
      realSetTimeout(handler, 0, ...args)) as typeof globalThis.setTimeout;
    try {
      await expect(disposeWalletCliDmkTransportFully()).resolves.toBeUndefined();
      expect(destroyTransport).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.setTimeout = realSetTimeout;
    }
  });

  it("fully awaits test transport disconnect even during dispose teardown", async () => {
    const finishDisconnect = deferred();
    const disconnect = mock(async () => {
      await finishDisconnect.promise;
    });
    const dmk = {
      getDeviceSessionState: () => of({}),
      disconnect,
    } as unknown as DeviceManagementKit;
    _setTestDmkTransport({
      dmk,
      sessionId: "test-session-1",
      close: async () => {},
    } as never);
    await ensureWalletCliDmkTransport();

    let disposeSettled = false;
    const disposePromise = disposeWalletCliDmkTransportFully().then(() => {
      disposeSettled = true;
    });
    await waitOneTick();
    expect(disposeSettled).toBe(false);
    finishDisconnect.resolve();
    await disposePromise;
    expect(disconnect).toHaveBeenCalledWith({ sessionId: "test-session-1" });
  });
});

describe("getWalletCliDeviceModelId", () => {
  it("returns undefined when no DMK session is active", async () => {
    await expect(getWalletCliDeviceModelId()).resolves.toBeUndefined();
  });

  it("maps the active DMK model id to the live-common device model id", async () => {
    const { transport } = makeTestTransport({ deviceModelId: DmkDeviceModelId.NANO_X });
    _setTestDmkTransport(transport as never);

    await ensureWalletCliDmkTransport();

    await expect(getWalletCliDeviceModelId()).resolves.toBe(LedgerDeviceModelId.nanoX);
  });
});

describe("registerWalletCliDmkTransport", () => {
  it("allows live-common callers to open and disconnect the wallet CLI device id", async () => {
    const { transport } = makeTestTransport({ deviceModelId: DmkDeviceModelId.NANO_X });
    _setTestDmkTransport(transport as never);

    registerWalletCliDmkTransport();
    registerWalletCliDmkTransport();

    await expect(openTransport("other-device")).rejects.toThrow(
      "Cannot find registered transport to open other-device",
    );
    const opened = await openTransport(WALLET_CLI_DMK_DEVICE_ID);
    expect(opened as unknown).toBe(transport);
    await expect(getWalletCliDeviceModelId()).resolves.toBe(LedgerDeviceModelId.nanoX);

    await expect(disconnectTransport("other-device")).rejects.toThrow(
      "Can't find handler to disconnect other-device",
    );
    await expect(disconnectTransport(WALLET_CLI_DMK_DEVICE_ID)).resolves.toBeUndefined();
    await expect(getWalletCliDeviceModelId()).resolves.toBeUndefined();
  });
});
