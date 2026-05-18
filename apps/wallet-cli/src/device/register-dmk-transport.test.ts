import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import {
  DeviceModelId as DmkDeviceModelId,
  DeviceStatus,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import { disconnect as disconnectTransport, open as openTransport } from "@ledgerhq/live-common/hw/index";
import { DeviceModelId as LedgerDeviceModelId } from "@ledgerhq/types-devices";
import { of } from "rxjs";

let createDeviceManagementKitImpl: () => Promise<{
  dmk: DeviceManagementKit;
  destroyTransport: () => Promise<void>;
}>;

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

function makeDmk({
  getSessionState = () => ({}),
}: {
  getSessionState?: () => unknown;
} = {}) {
  let nextSessionIndex = 0;
  const dmk = {
    listenToAvailableDevices: () => of([{ id: "ledger-usb-1" }]),
    connect: async () => {
      nextSessionIndex += 1;
      return `session-${nextSessionIndex}`;
    },
    getDeviceSessionState: () => of(getSessionState()),
    disconnect: async () => {},
    close: () => {},
  } as unknown as DeviceManagementKit;

  return {
    dmk,
    kit: {
      dmk,
      destroyTransport: async () => {},
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

  it("asks the user to retry when the initial session is busy", async () => {
    let sessionState: unknown = { deviceStatus: DeviceStatus.BUSY };
    const fake = makeDmk({ getSessionState: () => sessionState });
    createDeviceManagementKitImpl = async () => fake.kit;

    await expect(ensureWalletCliDmkTransport()).rejects.toThrow(
      "The Ledger device did not respond to the initial ping",
    );

    sessionState = {};
    await expect(ensureWalletCliDmkTransport()).resolves.toMatchObject({
      sessionId: "session-2",
    });
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
