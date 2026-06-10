import { afterEach, describe, expect, it } from "bun:test";
import {
  type ApduReceiverServiceFactory,
  type ApduSenderServiceFactory,
  type DeviceModelDataSource,
  type TransportArgs,
  type TransportConnectedDevice,
} from "@ledgerhq/device-management-kit";
import { Just, Right } from "purify-ts";
import { firstValueFrom, type Subscription } from "rxjs";
import {
  NodeBleTransport,
  nodeBleIdentifier,
  type NobleAdapter,
  type NobleCharacteristic,
  type NoblePeripheral,
  type NobleService,
} from "./NodeBleTransport";

const SERVICE_UUID = "13d634002c97300400004c6564676572"; // Flex
const WRITE_UUID = "13d634002c97300100004c6564676572";
const NOTIFY_UUID = "13d634002c97300200004c6564676572";
const DEVICE_MODEL = { id: "flex" } as never;

function flushTasks(): Promise<void> {
  return new Promise(resolve => queueMicrotask(resolve));
}

async function waitFor(assertion: () => void, attempts = 50): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await flushTasks();
    }
  }
  throw lastError;
}

// The sender turns an APDU into a single raw frame; the receiver echoes the
// payload back as a settled response on the first frame. Enough to prove the
// transport wires noble notifications into DMK's services and back out.
const apduSenderServiceFactory: ApduSenderServiceFactory = () => ({
  getFrames: (apdu: Uint8Array) => [{ getRawData: () => apdu } as never],
});
const apduReceiverServiceFactory: ApduReceiverServiceFactory = () => ({
  handleFrame: (frame: Uint8Array) =>
    Right(Just({ data: frame, statusCode: new Uint8Array([0x90, 0x00]) })) as never,
});

/** Minimal DMK args: device-model BLE specs + framing services the transport delegates to. */
function createTransportArgs(): TransportArgs {
  const deviceModelDataSource = {
    getBluetoothServices: () => [SERVICE_UUID],
    getBluetoothServicesInfos: () => ({
      [SERVICE_UUID]: {
        deviceModel: DEVICE_MODEL,
        serviceUuid: SERVICE_UUID,
        writeUuid: WRITE_UUID,
        writeCmdUuid: WRITE_UUID,
        notifyUuid: NOTIFY_UUID,
      },
    }),
  } as unknown as DeviceModelDataSource;

  return {
    deviceModelDataSource,
    loggerServiceFactory: () => ({ debug() {}, info() {}, warn() {}, error() {} }) as never,
    config: {} as never,
    apduSenderServiceFactory,
    apduReceiverServiceFactory,
  };
}

type FakeNobleControls = {
  noble: NobleAdapter;
  emitStateChange(state: string): void;
  emitDiscover(peripheral: NoblePeripheral): void;
};

function createFakeNoble(initialState = "poweredOn"): FakeNobleControls {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  let scanning = false;
  const noble: NobleAdapter = {
    state: initialState,
    on(event, cb) {
      (listeners.get(event) ?? listeners.set(event, new Set()).get(event)!).add(cb);
    },
    removeListener(event, cb) {
      listeners.get(event)?.delete(cb);
    },
    startScanning() {
      scanning = true;
    },
    stopScanning() {
      scanning = false;
    },
  };
  return {
    noble,
    emitStateChange: state => {
      noble.state = state;
      listeners.get("stateChange")?.forEach(cb => cb(state));
    },
    // Real noble only emits 'discover' while a scan is active.
    emitDiscover: peripheral => {
      if (scanning) {
        listeners.get("discover")?.forEach(cb => cb(peripheral));
      }
    },
  };
}

/** A fake Ledger peripheral whose notify characteristic answers the 0x08 MTU probe, then echoes writes. */
function createLedgerPeripheral(id: string, localName: string): NoblePeripheral {
  let dataListener: ((data: Buffer) => void) | null = null;
  let mtuAnswered = false;
  const notifyChar: NobleCharacteristic = {
    uuid: NOTIFY_UUID,
    subscribe: cb => cb(),
    unsubscribe: cb => cb?.(),
    on: (_event, cb) => {
      dataListener = cb;
    },
    removeAllListeners: () => {
      dataListener = null;
    },
    write: (_data, _withoutResponse, cb) => cb(),
  };
  const writeChar: NobleCharacteristic = {
    uuid: WRITE_UUID,
    subscribe: cb => cb(),
    unsubscribe: cb => cb?.(),
    on: () => {},
    removeAllListeners: () => {},
    write: (data, _withoutResponse, cb) => {
      cb();
      // First write is the 0x08 GET-MTU probe; answer it so connect() resolves.
      if (!mtuAnswered && data[0] === 0x08) {
        mtuAnswered = true;
        queueMicrotask(() => dataListener?.(Buffer.from([0x08, 0, 0, 0, 0, 153])));
        return;
      }
      // Any later write is an APDU frame; echo it straight back as the response.
      queueMicrotask(() => dataListener?.(Buffer.from(data)));
    },
  };
  const service: NobleService = {
    uuid: SERVICE_UUID,
    discoverCharacteristics: (_uuids, cb) => cb(null, [writeChar, notifyChar]),
  };
  return {
    id,
    state: "disconnected",
    advertisement: { localName, serviceUuids: [SERVICE_UUID] },
    connect(cb) {
      this.state = "connected";
      cb();
    },
    disconnect: cb => cb(),
    discoverServices: (_uuids, cb) => cb(null, [service]),
    once: () => {},
    removeAllListeners: () => {},
  };
}

const subscriptions: Subscription[] = [];
afterEach(() => {
  while (subscriptions.length) {
    subscriptions.pop()?.unsubscribe();
  }
});

describe("NodeBleTransport", () => {
  it("identifies as NODE-BLE and supported", () => {
    const transport = new NodeBleTransport(createTransportArgs(), createFakeNoble().noble);
    expect(transport.getIdentifier()).toBe(nodeBleIdentifier);
    expect(transport.isSupported()).toBe(true);
  });

  it("surfaces a Ledger peripheral on discovery and ignores non-Ledger devices", async () => {
    const fake = createFakeNoble();
    const transport = new NodeBleTransport(createTransportArgs(), fake.noble);
    const discovered = firstValueFrom(transport.startDiscovering());

    fake.emitDiscover({
      id: "other",
      state: "disconnected",
      advertisement: { localName: "AirPods", serviceUuids: ["ffff"] },
      connect: cb => cb(),
      disconnect: cb => cb(),
      discoverServices: (_u, cb) => cb(null, []),
      once: () => {},
      removeAllListeners: () => {},
    });
    fake.emitDiscover(createLedgerPeripheral("ledger-1", "Solmaria"));

    const device = await discovered;
    expect(device.id).toBe("ledger-1");
    expect(device.name).toBe("Solmaria");
    expect(device.transport).toBe(nodeBleIdentifier);
  });

  it("waits for poweredOn before scanning", async () => {
    const fake = createFakeNoble("poweredOff");
    const transport = new NodeBleTransport(createTransportArgs(), fake.noble);
    const discovered = firstValueFrom(transport.startDiscovering());

    fake.emitDiscover(createLedgerPeripheral("ledger-1", "Solmaria")); // dropped: not scanning yet
    await flushTasks();
    fake.emitStateChange("poweredOn");
    fake.emitDiscover(createLedgerPeripheral("ledger-2", "Solmaria"));

    expect((await discovered).id).toBe("ledger-2");
  });

  it("connects, negotiates MTU, round-trips an APDU, and reports an unknown device", async () => {
    const fake = createFakeNoble();
    const transport = new NodeBleTransport(createTransportArgs(), fake.noble);
    subscriptions.push(transport.startDiscovering().subscribe());
    fake.emitDiscover(createLedgerPeripheral("ledger-1", "Solmaria"));
    await waitFor(() => expect(transport).toBeDefined());

    const result = await transport.connect({ deviceId: "ledger-1", onDisconnect: () => {} });
    expect(result.isRight()).toBe(true);
    const connected = result.extract() as TransportConnectedDevice;
    expect(connected.transport).toBe(nodeBleIdentifier);

    const response = await connected.sendApdu(new Uint8Array([0xe0, 0x01, 0x00, 0x00]));
    expect((response as { isRight(): boolean }).isRight()).toBe(true);

    const unknown = await transport.connect({ deviceId: "nope", onDisconnect: () => {} });
    expect(unknown.isLeft()).toBe(true);
  });

  it("disconnect is idempotent and tears the connection down", async () => {
    const fake = createFakeNoble();
    const transport = new NodeBleTransport(createTransportArgs(), fake.noble);
    subscriptions.push(transport.startDiscovering().subscribe());
    fake.emitDiscover(createLedgerPeripheral("ledger-1", "Solmaria"));
    await flushTasks();

    const connected = (
      await transport.connect({ deviceId: "ledger-1", onDisconnect: () => {} })
    ).extract() as TransportConnectedDevice;

    const first = await transport.disconnect({ connectedDevice: connected });
    const second = await transport.disconnect({ connectedDevice: connected });
    expect(first.isRight()).toBe(true);
    expect(second.isRight()).toBe(true); // no live connection left — still a clean Right
  });
});
