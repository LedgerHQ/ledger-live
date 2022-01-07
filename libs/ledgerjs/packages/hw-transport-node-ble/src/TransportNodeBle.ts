import Transport from "@ledgerhq/hw-transport";
import type { DeviceModel } from "@ledgerhq/devices";
import { sendAPDU } from "@ledgerhq/devices/lib/ble/sendAPDU";
import { receiveAPDU } from "@ledgerhq/devices/lib/ble/receiveAPDU";
import { log } from "@ledgerhq/logs";
import { Observable, Subscription, defer, merge, from } from "rxjs";
import { share, ignoreElements, first, map, tap } from "rxjs/operators";
import {
  CantOpenDevice,
  DisconnectedDeviceDuringOperation,
} from "@ledgerhq/errors";
import {
  monitorCharacteristic,
  availability,
  retrieveServiceAndCharacteristics,
  write,
  disconnectDevice,
  listen,
  listenDeviceDisconnect,
  connectDevice,
  isDeviceDisconnected,
} from "./platform";

type Device = any;

const transportsCache = {};

type ReconnectionConfig = {
  pairingThreshold: number;
  delayAfterFirstPairing: number;
};

let reconnectionConfig: ReconnectionConfig | null | undefined = {
  pairingThreshold: 1000,
  delayAfterFirstPairing: 4000,
};

export function setReconnectionConfig(
  config: ReconnectionConfig | null | undefined
) {
  reconnectionConfig = config;
}

const delay = (ms) => new Promise((success) => setTimeout(success, ms));

async function open(deviceOrId: Device | string, needsReconnect: boolean) {
  let device;

  if (typeof deviceOrId === "string") {
    if (transportsCache[deviceOrId]) {
      log("ble-verbose", "Transport in cache, using that.");
      return transportsCache[deviceOrId];
    }
  } else {
    device = deviceOrId;
  }

  if (!device) {
    throw new CantOpenDevice();
  }

  await availability.pipe(first((enabled) => enabled)).toPromise();

  if (isDeviceDisconnected(device)) {
    log("ble-verbose", "not connected. connecting...");
    await connectDevice(device);
  }

  const { notifyC, writeC, deviceModel } =
    await retrieveServiceAndCharacteristics(device);
  const [observable, monitoringReady] = monitorCharacteristic(notifyC);
  const notifyObservable = observable.pipe(
    tap((value) => {
      log("ble-frame", "<= " + value.toString("hex"));
    }),
    share()
  );
  const notif = notifyObservable.subscribe();
  const transport = new BluetoothTransport(
    device,
    writeC,
    notifyObservable,
    deviceModel
  );

  const onDisconnect = (e) => {
    transport.notYetDisconnected = false;
    notif.unsubscribe();
    disconnectedSub();
    delete transportsCache[transport.id];
    log("ble-verbose", `BleTransport(${transport.id}) disconnected`);
    transport.emit("disconnect", e);
  };

  // eslint-disable-next-line require-atomic-updates
  transportsCache[transport.id] = transport;
  const disconnectedSub = listenDeviceDisconnect(device, (e) => {
    if (!transport.notYetDisconnected) return;
    onDisconnect(e);
  });
  const beforeMTUTime = Date.now();

  try {
    await monitoringReady;
    await transport.inferMTU();
  } finally {
    const afterMTUTime = Date.now();

    if (reconnectionConfig) {
      // workaround for #279: we need to open() again if we come the first time here,
      // to make sure we do a disconnect() after the first pairing time
      // because of a firmware bug
      if (afterMTUTime - beforeMTUTime < reconnectionConfig.pairingThreshold) {
        needsReconnect = false; // (optim) there is likely no new pairing done because mtu answer was fast.
      }

      if (needsReconnect) {
        // necessary time for the bonding workaround
        await disconnectDevice(device).catch(() => {});
        await delay(reconnectionConfig.delayAfterFirstPairing);
      }
    } else {
      needsReconnect = false;
    }
  }

  if (needsReconnect) {
    return open(device, false);
  }

  return transport;
}

/**
 * TransportNodeBle bluetooth BLE implementation
 * @example
 * import BluetoothTransport from "@ledgerhq/hw-transport-node-ble";
 */
export default class BluetoothTransport extends Transport {
  /**
   *
   */
  static isSupported = (): Promise<boolean> => Promise.resolve(true);

  /**
   *
   */
  static availability = availability;
  static list = (): any => {
    throw new Error("not implemented");
  };

  /**
   * Scan for bluetooth Ledger devices
   */
  static listen(observer: any): Subscription {
    log("ble-verbose", "listen...");
    return listen().subscribe(observer);
  }

  /**
   * Open a BLE transport
   * @param {*} deviceOrId
   */
  static async open(deviceOrId: Device | string) {
    return open(deviceOrId, true);
  }

  /**
   * Globally disconnect a BLE device by its ID
   */
  static disconnect = async (id: any) => {
    log("ble-verbose", `user disconnect(${id})`);

    if (id in transportsCache) {
      disconnectDevice(transportsCache[id].device);
    }
  };
  id: string;
  device: Device;
  mtuSize = 20;
  writeCharacteristic: any;
  notifyObservable: Observable<Buffer>;
  deviceModel: DeviceModel;
  notYetDisconnected = true;

  constructor(
    device: Device,
    writeCharacteristic: any,
    notifyObservable: Observable<Buffer>,
    deviceModel: DeviceModel
  ) {
    super();
    this.id = device.id;
    this.device = device;
    this.writeCharacteristic = writeCharacteristic;
    this.notifyObservable = notifyObservable;
    this.deviceModel = deviceModel;
    log("ble-verbose", `BleTransport(${String(this.id)}) new instance`);
  }

  /**
   * communicate with a BLE transport
   */
  exchange = (apdu: Buffer): Promise<any> =>
    this.exchangeAtomicImpl(async () => {
      try {
        const msgIn = apdu.toString("hex");
        log("apdu", `=> ${msgIn}`);
        const data = await merge(
          this.notifyObservable.pipe(receiveAPDU),
          sendAPDU(this.write, apdu, this.mtuSize)
        ).toPromise();
        const msgOut = data.toString("hex");
        log("apdu", `<= ${msgOut}`);
        return data;
      } catch (e) {
        log("ble-error", "exchange got " + String(e));

        if (this.notYetDisconnected) {
          // in such case we will always disconnect because something is bad.
          await disconnectDevice(this.device).catch(() => {}); // but we ignore if disconnect worked.
        }

        throw e;
      }
    });

  // TODO we probably will do this at end of open
  async inferMTU() {
    let { mtu } = this.device;
    await this.exchangeAtomicImpl(async () => {
      try {
        mtu =
          (await merge(
            this.notifyObservable.pipe(
              first((buffer) => buffer.readUInt8(0) === 0x08),
              map((buffer) => buffer.readUInt8(5))
            ),
            defer(() => from(this.write(Buffer.from([0x08, 0, 0, 0, 0])))).pipe(
              ignoreElements()
            )
          ).toPromise()) + 3;
      } catch (e) {
        log("ble-error", "inferMTU got " + String(e));
        await disconnectDevice(this.device).catch(() => {}); // but we ignore if disconnect worked.

        throw e;
      }
    });

    if (mtu > 23) {
      const mtuSize = mtu - 3;
      log(
        "ble-verbose",
        `BleTransport(${String(this.id)}) mtu set to ${String(mtuSize)}`
      );
      this.mtuSize = mtuSize;
    }

    return this.mtuSize;
  }

  setScrambleKey() {}

  write = async (buffer: Buffer) => {
    log("ble-frame", "=> " + buffer.toString("hex"));

    try {
      await write(this.writeCharacteristic, buffer);
    } catch (e: any) {
      throw new DisconnectedDeviceDuringOperation(e.message);
    }
  };

  async close() {
    if (this.exchangeBusyPromise) {
      await this.exchangeBusyPromise;
    }
  }
}
