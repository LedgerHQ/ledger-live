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
/**
 * node-hid Transport implementation
 * @example
 * import TransportNodeHid from "@ledgerhq/hw-transport-node-hid-singleton";
 * ...
 * TransportNodeHid.create().then(transport => ...)
 */

export default class TransportNodeHidSingleton extends TransportNodeHidNoEvents {
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
   * globally disconnect the transport singleton
   */
  static async disconnect() {
    if (transportInstance) {
      transportInstance.device.close();
      transportInstance.emit("disconnect");
      transportInstance = null;
    }
  }

  /**
   * if path="" is not provided, the library will take the first device
   */
  static open(): Promise<TransportNodeHidSingleton> {
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

  close() {
    // intentionally, a close will not effectively close the hid connection
    return Promise.resolve();
  }
}
