import HID from "node-hid";
import TransportNodeHidNoEvents, { getDevices } from "@ledgerhq/hw-transport-node-hid-noevents";
import type { Observer, DescriptorEvent, Subscription } from "@ledgerhq/hw-transport";
import { LocalTracer, TraceContext, trace } from "@ledgerhq/logs";
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
   * Disconnects singleton instance, if it exist and is not prevented from disconnecting.
   *
   * The prevention is handled by `preventAutoDisconnect`.
   * If it is prevented from disconnection, this function is retried in DISCONNECT_TIMEOUT.
   * Used in pair with `setDisconnectTimeout`.
   */
  static async autoDisconnect(): Promise<void> {
    trace({
      type: LOG_TYPE,
      message: "Starting auto disconnect",
      data: {
        hasInstance: Boolean(transportInstance),
        preventAutoDisconnect: Boolean(transportInstance?.preventAutoDisconnect),
      },
    });

    if (transportInstance && !transportInstance.preventAutoDisconnect) {
      TransportNodeHidSingleton.disconnect();
    } else if (transportInstance) {
      // If we have disabled the auto-disconnect, try again in DISCONNECT_TIMEOUT
      clearDisconnectTimeout();
      setDisconnectTimeout();
    }
  }

  /**
   * TODO: OK this is not called from no event <- check
   *
   * globally disconnect the transport singleton
   */
  static async disconnect() {
    trace({
      type: LOG_TYPE,
      message: `Disconnecting from static disconnect function call: current transport instance ? ${!!transportInstance}`,
    });

    if (transportInstance) {
      transportInstance.device.close();
      transportInstance = null;

      trace({
        type: LOG_TYPE,
        message: `Emitting "disconnect" event from static disconnect`,
      });
      transportInstance.emit("disconnect");
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

      const devicesDetectedDuringOpen = getDevices();
      tracer.trace(`Devices detected during open: ${devicesDetectedDuringOpen.length}`, {
        devicesDetectedDuringOpen,
      });

      const device = devicesDetectedDuringOpen[0];
      if (!device) throw new CantOpenDevice("no device found");

      tracer.trace("Found a device, creating HID transport instance ...", { device });

      let HIDDevice: HID | undefined;
      try {
        HIDDevice = new HID.HID(device.path as string);
      } catch (error) {
        tracer.trace(`Error while connecting to device: ${error}`, { error });
        throw error;
      }

      transportInstance = new TransportNodeHidSingleton(HIDDevice, {
        context,
      });

      const unlisten = listenDevices(
        () => {},
        () => {
          // Assumes any ledger disconnection concerns current transport
          if (transportInstance) {
            tracer.trace("Listened to on remove device event. Emitting a disconnect");
            transportInstance.emit("disconnect");
          }
        },
      );

      const onDisconnect = () => {
        if (!transportInstance) {
          tracer.trace("disconnect event without transport instance, ignoring ...");
          return;
        }
        // TODO: not here ? Should we call `disconnect` ?
        transportInstance.off("disconnect", onDisconnect);
        // TransportNodeHidSingleton.disconnect();
        // tracer.trace("Device was disconnected, clearing transport singleton instance ...");

        transportInstance = null;
        unlisten();
      };

      transportInstance.on("disconnect", onDisconnect);
      return transportInstance;
    });
  }

  setAllowAutoDisconnect(allow: boolean): void {
    this.tracer.trace("Setting allow auto-disconnect", { allow });
    this.preventAutoDisconnect = !allow;
  }

  /**
   * Exchange with the device using APDU protocol.
   *
   * @param apdu
   * @returns a promise of apdu response
   */
  async exchange(
    apdu: Buffer,
    { abortTimeoutMs }: { abortTimeoutMs?: number } = {},
  ): Promise<Buffer> {
    clearDisconnectTimeout();
    const result = await super.exchange(apdu, { abortTimeoutMs });
    setDisconnectTimeout();
    return result;
  }

  // TODO: understand and document this
  async close(): Promise<void> {
    this.tracer.trace(
      "Calling close on HID Transport instance, brut forcing auto disconnect. Not doing anything.",
      {
        oldPreventAutoDisconnect: this.preventAutoDisconnect,
        hasInstance: !!transportInstance,
      },
    );
    // intentionally, a close will not effectively close the hid connection but
    // will allow an auto-disconnection after some inactivity
    this.preventAutoDisconnect = false;
    // TODO: brut force ?
    // return await TransportNodeHidSingleton.autoDisconnect();
    return Promise.resolve();
  }
}
