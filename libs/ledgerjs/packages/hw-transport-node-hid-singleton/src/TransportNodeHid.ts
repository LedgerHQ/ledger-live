import HID from "node-hid";
import TransportNodeHidNoEvents, { getDevices } from "@ledgerhq/hw-transport-node-hid-noevents";
import type { Observer, DescriptorEvent, Subscription } from "@ledgerhq/hw-transport";
import { LocalTracer, TraceContext, log } from "@ledgerhq/logs";
import { identifyUSBProductId } from "@ledgerhq/devices";
import { CantOpenDevice } from "@ledgerhq/errors";
import { listenDevices } from "./listenDevices";

const LOG_TYPE = "hid-verbose";

let transportInstance: TransportNodeHidSingleton | null = null;

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
    DISCONNECT_TIMEOUT,
  );
};

export type ListenDescriptorEvent = DescriptorEvent<any>;

/**
 * node-hid Transport implementation
 * @example
 * import TransportNodeHid from "@ledgerhq/hw-transport-node-hid-singleton";
 * ...
 * TransportNodeHid.create().then(transport => ...)
 */
export default class TransportNodeHidSingleton extends TransportNodeHidNoEvents {
  preventAutoDisconnect = false;

  constructor(device: HID.HID, { context }: { context?: TraceContext } = {}) {
    super(device, { context, logType: LOG_TYPE });
  }

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
  static listen = (observer: Observer<ListenDescriptorEvent>): Subscription => {
    let unsubscribed: boolean;
    Promise.resolve(getDevices()).then(devices => {
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

    const onAdd = device => {
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

    const onRemove = device => {
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
   * Connects to the first Ledger device connected via USB
   *
   * Reusing the same TransportNodeHidSingleton instance until a disconnection happens.
   * Pitfall: this implementation only handles 1 device connected via USB
   *
   * Legacy: `_descriptor` is needed to follow the Transport definition
   */
  static open(
    _descriptor: string,
    _timeoutMs?: number,
    context?: TraceContext,
  ): Promise<TransportNodeHidSingleton> {
    const tracer = new LocalTracer(LOG_TYPE, context);
    clearDisconnectTimeout();

    return Promise.resolve().then(() => {
      if (transportInstance) {
        tracer.trace("Reusing already opened transport instance");
        return transportInstance;
      }

      const device = getDevices()[0];
      if (!device) throw new CantOpenDevice("no device found");

      tracer.trace("Found a device, creating HID transport instance ...", { device });
      transportInstance = new TransportNodeHidSingleton(new HID.HID(device.path as string), {
        context,
      });

      const unlisten = listenDevices(
        () => {},
        () => {
          // Assumes any ledger disconnection concerns current transport
          if (transportInstance) {
            transportInstance.emit("disconnect");
          }
        },
      );

      const onDisconnect = () => {
        if (!transportInstance) return;
        tracer.trace("Device was disconnected, clearing transport instance ...");
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
   *
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
