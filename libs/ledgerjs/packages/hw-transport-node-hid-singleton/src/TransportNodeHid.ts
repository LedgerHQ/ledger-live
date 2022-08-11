import HID from "node-hid";
import TransportNodeHidNoEvents, {
  getDevices,
} from "@ledgerhq/hw-transport-node-hid-noevents";
import type {
  Observer,
  DescriptorEvent,
  Subscription,
} from "@ledgerhq/hw-transport";
import { log } from "@ledgerhq/logs";
import { identifyUSBProductId } from "@ledgerhq/devices";
import { CantOpenDevice } from "@ledgerhq/errors";
import { listenDevices } from "./listenDevices";

let transportInstance;

const DISCONNECT_TIMEOUT = 5000;
let disconnectTimeout;
const clearDisconnectTimeout = () => {
  if (disconnectTimeout) {
    clearTimeout(disconnectTimeout);
  }
};

const setDisconnectTimeout = () => {
  clearDisconnectTimeout();
  disconnectTimeout = setTimeout(
    () => TransportNodeHidSingleton.autoDisconnect(),
    DISCONNECT_TIMEOUT
  );
};

/**
 * node-hid Transport implementation
 * @example
 * import TransportNodeHid from "@ledgerhq/hw-transport-node-hid-singleton";
 * ...
 * TransportNodeHid.create().then(transport => ...)
 */

export default class TransportNodeHidSingleton extends TransportNodeHidNoEvents {
  preventAutoDisconnect = false;
  /**
   *
   */
  static isSupported = TransportNodeHidNoEvents.isSupported;

  /**
   *
   */
  static list = TransportNodeHidNoEvents.list;

  /**
   */
  static listen = (observer: Observer<DescriptorEvent<any>>): Subscription => {
    let unsubscribed;
    Promise.resolve(getDevices()).then((devices) => {
      // this needs to run asynchronously so the subscription is defined during this phase
      for (const device of devices) {
        if (!unsubscribed) {
          const deviceModel = identifyUSBProductId(device.productId);
          observer.next({
            type: "add",
            descriptor: "",
            device: {
              name: device.deviceName,
            },
            deviceModel,
          });
        }
      }
    });

    const onAdd = (device) => {
      const deviceModel = identifyUSBProductId(device.productId);
      observer.next({
        type: "add",
        descriptor: "",
        deviceModel,
        device: {
          name: device.deviceName,
        },
      });
    };

    const onRemove = (device) => {
      const deviceModel = identifyUSBProductId(device.productId);
      observer.next({
        type: "remove",
        descriptor: "",
        deviceModel,
        device: {
          name: device.deviceName,
        },
      });
    };

    const stop = listenDevices(onAdd, onRemove);

    function unsubscribe() {
      stop();
      unsubscribed = true;
    }

    return {
      unsubscribe,
    };
  };

  /**
   * convenience wrapper for auto-disconnect logic
   */
  static async autoDisconnect(): Promise<void> {
    if (transportInstance && !transportInstance.preventAutoDisconnect) {
      log("hid-verbose", "triggering auto disconnect");
      TransportNodeHidSingleton.disconnect();
    } else if (transportInstance) {
      // If we have disabled the auto-disconnect, try again in DISCONNECT_TIMEOUT
      clearDisconnectTimeout();
      setDisconnectTimeout();
    }
  }

  /**
   * globally disconnect the transport singleton
   */
  static async disconnect() {
    if (transportInstance) {
      transportInstance.device.close();
      transportInstance.emit("disconnect");
      transportInstance = null;
    }
    clearDisconnectTimeout();
  }

  /**
   * if path="" is not provided, the library will take the first device
   */
  static open(): Promise<TransportNodeHidSingleton> {
    clearDisconnectTimeout();
    return Promise.resolve().then(() => {
      if (transportInstance) {
        log("hid-verbose", "reusing opened transport instance");
        return transportInstance;
      }

      const device = getDevices()[0];
      if (!device) throw new CantOpenDevice("no device found");
      log("hid-verbose", "new HID transport");
      transportInstance = new TransportNodeHidSingleton(
        new HID.HID(device.path as string)
      );
      const unlisten = listenDevices(
        () => {},
        () => {
          // assume any ledger disconnection concerns current transport
          if (transportInstance) {
            transportInstance.emit("disconnect");
          }
        }
      );

      const onDisconnect = () => {
        if (!transportInstance) return;
        log("hid-verbose", "transport instance was disconnected");
        transportInstance.off("disconnect", onDisconnect);
        transportInstance = null;
        unlisten();
      };

      transportInstance.on("disconnect", onDisconnect);
      return transportInstance;
    });
  }

  setAllowAutoDisconnect(allow: boolean): void {
    this.preventAutoDisconnect = !allow;
  }

  /**
   * Exchange with the device using APDU protocol.
   * @param apdu
   * @returns a promise of apdu response
   */
  async exchange(apdu: Buffer): Promise<Buffer> {
    clearDisconnectTimeout();
    const result = await super.exchange(apdu);
    setDisconnectTimeout();
    return result;
  }

  close(): Promise<void> {
    // intentionally, a close will not effectively close the hid connection but
    // will allow an auto-disconnection after some inactivity
    this.preventAutoDisconnect = false;
    return Promise.resolve();
  }
}
