import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  DeviceModelId as DmkDeviceModelId,
  DeviceStatus,
  OpeningConnectionError,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import {
  disconnect as disconnectTransport,
  open as openTransport,
} from "@ledgerhq/live-common/hw/index";
import type { SpeculosTarget } from "@ledgerhq/live-dmk-shared/transport/speculosTarget";
import { DeviceModelId as LedgerDeviceModelId } from "@ledgerhq/types-devices";
import { of } from "rxjs";
import {
  WALLET_CLI_DMK_DEVICE_ID,
  _setTestDmk,
  _setTestDmkTransport,
  disposeWalletCliDmkTransportFully,
  ensureWalletCliDmkTransport,
  getWalletCliDeviceModelId,
  registerWalletCliDmkTransport,
  resetWalletCliDmkSession,
} from "./register-dmk-transport";
import type { WalletCliDmk } from "./dmk";
import { getActiveSpeculosTarget } from "./speculos-target";
import { resetTestSeams } from "../shared/test-seam";

// USB-only paths: Speculos always discovers its device, so these run on a fake kit.
// `register-dmk-transport.cli.test.ts` covers the real kit on a fake Speculos.

type KitBehaviour = {
  devices?: { id: string }[];
  connect?: () => Promise<string>;
  sessionState?: () => unknown;
  disconnect?: () => Promise<void>;
  destroyTransport?: () => Promise<void>;
};

/** USB kits the code under test builds, in order, each logging what was called on it. */
class FakeKits {
  readonly log: string[] = [];
  readonly speculosTargets: (SpeculosTarget | null)[] = [];
  private readonly behaviours: (KitBehaviour | Error)[];

  constructor(...behaviours: (KitBehaviour | Error)[]) {
    this.behaviours = behaviours;
    _setTestDmk(speculos => this.build(speculos));
  }

  private build(speculos: SpeculosTarget | null): Promise<WalletCliDmk> {
    const kitNumber = this.speculosTargets.push(speculos);
    const behaviour = this.behaviours.shift() ?? {};
    if (behaviour instanceof Error) return Promise.reject(behaviour);
    const log = (event: string) => this.log.push(`kit ${kitNumber}: ${event}`);
    let sessions = 0;
    const dmk = {
      listenToAvailableDevices: () => of(behaviour.devices ?? [{ id: "ledger-usb" }]),
      connect:
        behaviour.connect ??
        (() => {
          sessions += 1;
          return Promise.resolve(`session-${kitNumber}.${sessions}`);
        }),
      getDeviceSessionState: () => of(behaviour.sessionState?.() ?? {}),
      disconnect: ({ sessionId }: { sessionId: string }) => {
        log(`disconnect ${sessionId}`);
        return behaviour.disconnect?.() ?? Promise.resolve();
      },
      close: () => log("close"),
    } as unknown as DeviceManagementKit;
    return Promise.resolve({
      dmk,
      destroyTransport: () => {
        log("destroy transport");
        return behaviour.destroyTransport?.() ?? Promise.resolve();
      },
    });
  }
}

function testTransport(sessionState: unknown = {}, disconnect = () => Promise.resolve()) {
  const dmk = {
    getDeviceSessionState: () => of(sessionState),
    disconnect,
  } as unknown as DeviceManagementKit;
  return { dmk, sessionId: "test-session-1", close: () => Promise.resolve() };
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

async function withSpeculosPort(run: () => unknown): Promise<void> {
  process.env.SPECULOS_API_PORT = "40000";
  try {
    await run();
  } finally {
    delete process.env.SPECULOS_API_PORT;
  }
}

const nextTick = () => new Promise(resolve => setTimeout(resolve, 0));

/** Runs `run` with every `setTimeout` firing at once, so the 1 s dispose bound costs nothing. */
async function withInstantTimeouts(run: () => Promise<void>): Promise<void> {
  const realSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = ((handler: TimerHandler, _timeout?: number, ...args: unknown[]) =>
    realSetTimeout(handler, 0, ...args)) as typeof globalThis.setTimeout;
  try {
    await run();
  } finally {
    globalThis.setTimeout = realSetTimeout;
  }
}

beforeEach(async () => {
  _setTestDmkTransport(null);
  await disposeWalletCliDmkTransportFully();
  // A test that builds no fake kit must fail here rather than load node-usb through `./dmk`.
  _setTestDmk(() => Promise.reject(new Error("no fake DMK kit for this test")));
});

afterEach(async () => {
  await disposeWalletCliDmkTransportFully();
  resetTestSeams();
});

describe("ensureWalletCliDmkTransport on USB", () => {
  it("refuses a new kit factory while a kit is cached, so the cached one is never left open", async () => {
    new FakeKits();
    await ensureWalletCliDmkTransport();

    expect(() => _setTestDmk(null)).toThrow("Dispose the cached DMK kit");
    await disposeWalletCliDmkTransportFully();
    expect(() => _setTestDmk(null)).not.toThrow();
  });

  it.each([
    ["no Ledger is plugged in", { devices: [] }, "No Ledger device found. Unlock the device"],
    [
      "the USB connect fails",
      { connect: () => Promise.reject(new Error("USB connect failed")) },
      "USB connect failed",
    ],
  ])("closes the kit when %s, so the next open builds a new one", async (_case, kit, message) => {
    const kits = new FakeKits(kit);

    await expect(ensureWalletCliDmkTransport()).rejects.toThrow(message);
    expect(kits.log).toEqual(["kit 1: destroy transport", "kit 1: close"]);

    await expect(ensureWalletCliDmkTransport()).resolves.toMatchObject({
      sessionId: "session-2.1",
    });
  });

  it("builds a new kit after the previous one failed to build", async () => {
    const kits = new FakeKits(new Error("failed to create DMK"));

    await expect(ensureWalletCliDmkTransport()).rejects.toThrow("failed to create DMK");
    await expect(ensureWalletCliDmkTransport()).resolves.toMatchObject({
      sessionId: "session-2.1",
    });
    expect(kits.speculosTargets).toHaveLength(2);
  });

  it("asks the user to retry when the initial session is busy, keeping the kit", async () => {
    let status: DeviceStatus | undefined = DeviceStatus.BUSY;
    const kits = new FakeKits({ sessionState: () => ({ deviceStatus: status }) });

    await expect(ensureWalletCliDmkTransport()).rejects.toThrow(
      "The Ledger device did not respond to the initial ping",
    );
    expect(kits.log).toEqual(["kit 1: disconnect session-1.1"]);

    status = undefined;
    await expect(ensureWalletCliDmkTransport()).resolves.toMatchObject({
      sessionId: "session-1.2",
    });
  });

  it("names a DMK error's tag and cause when a Speculos connect fails with one", async () => {
    const cause = new OpeningConnectionError(new Error("socket hang up"));
    new FakeKits({ connect: () => Promise.reject(cause) });

    await withSpeculosPort(() =>
      expect(ensureWalletCliDmkTransport()).rejects.toMatchObject({
        state: {
          code: "disconnected",
          speculosUrl: "http://127.0.0.1:40000",
          detail: "ConnectionOpeningError: socket hang up",
        },
        cause,
      }),
    );
  });

  it("shares one connection between concurrent opens", async () => {
    const connecting = deferred();
    const kits = new FakeKits({ connect: () => connecting.promise.then(() => "session-1") });

    const opens = Promise.all([ensureWalletCliDmkTransport(), ensureWalletCliDmkTransport()]);
    connecting.resolve();
    const [first, second] = await opens;

    expect(first).toBe(second);
    expect(kits.speculosTargets).toHaveLength(1);
  });
});

describe("teardown", () => {
  it("waits for the USB transport to be destroyed before a reset returns", async () => {
    const destroyed = deferred();
    const kits = new FakeKits({ destroyTransport: () => destroyed.promise });
    await ensureWalletCliDmkTransport();

    let resetDone = false;
    const reset = resetWalletCliDmkSession().then(() => {
      resetDone = true;
    });
    await nextTick();
    expect(resetDone).toBe(false);

    destroyed.resolve();
    await reset;
    expect(kits.log).toEqual([
      "kit 1: disconnect session-1.1",
      "kit 1: destroy transport",
      "kit 1: close",
    ]);
  });

  it("stops waiting for a wedged USB transport on dispose and still closes the kit", async () => {
    const kits = new FakeKits({ destroyTransport: () => new Promise(() => {}) });
    await ensureWalletCliDmkTransport();

    await withInstantTimeouts(() => disposeWalletCliDmkTransportFully());

    expect(kits.log).toEqual([
      "kit 1: disconnect session-1.1",
      "kit 1: destroy transport",
      "kit 1: close",
    ]);
  });

  it("waits for a test transport to disconnect, even on dispose", async () => {
    const disconnected = deferred();
    _setTestDmkTransport(testTransport({}, () => disconnected.promise) as never);
    await ensureWalletCliDmkTransport();

    let disposeDone = false;
    const dispose = disposeWalletCliDmkTransportFully().then(() => {
      disposeDone = true;
    });
    await nextTick();
    expect(disposeDone).toBe(false);

    disconnected.resolve();
    await dispose;
  });
});

describe("getWalletCliDeviceModelId", () => {
  it("returns undefined when no DMK session is active", async () => {
    await expect(getWalletCliDeviceModelId()).resolves.toBeUndefined();
  });

  it("maps the active DMK model id to the live-common device model id", async () => {
    _setTestDmkTransport(testTransport({ deviceModelId: DmkDeviceModelId.NANO_X }) as never);

    await ensureWalletCliDmkTransport();

    await expect(getWalletCliDeviceModelId()).resolves.toBe(LedgerDeviceModelId.nanoX);
  });
});

describe("registerWalletCliDmkTransport", () => {
  it("opens and disconnects only the wallet CLI device id for live-common callers", async () => {
    const transport = testTransport({ deviceModelId: DmkDeviceModelId.NANO_X });
    _setTestDmkTransport(transport as never);

    registerWalletCliDmkTransport();
    registerWalletCliDmkTransport();

    await expect(openTransport("other-device")).rejects.toThrow(
      "Cannot find registered transport to open other-device",
    );
    expect((await openTransport(WALLET_CLI_DMK_DEVICE_ID)) as unknown).toBe(transport);

    await expect(disconnectTransport("other-device")).rejects.toThrow(
      "Can't find handler to disconnect other-device",
    );
    await expect(disconnectTransport(WALLET_CLI_DMK_DEVICE_ID)).resolves.toBeUndefined();
    await expect(getWalletCliDeviceModelId()).resolves.toBeUndefined();
  });

  it("builds a USB kit for usbOnly callers even with SPECULOS_API_PORT set", async () => {
    const kits = new FakeKits();

    await withSpeculosPort(async () => {
      try {
        registerWalletCliDmkTransport({ usbOnly: true });
        expect(getActiveSpeculosTarget()).toBeNull();
        await ensureWalletCliDmkTransport();
        await disposeWalletCliDmkTransportFully();
        registerWalletCliDmkTransport();
        await ensureWalletCliDmkTransport();
      } finally {
        registerWalletCliDmkTransport();
      }
    });

    const speculos = { url: "http://127.0.0.1:40000", deviceModelId: DmkDeviceModelId.NANO_SP };
    expect(kits.speculosTargets).toEqual([null, speculos]);
  });
});
