import HID from "node-hid";
import TransportNodeHidNoEvents, { getDevices } from "@ledgerhq/hw-transport-node-hid-noevents";
import type { Observer, DescriptorEvent, Subscription } from "@ledgerhq/hw-transport";
import { LocalTracer, TraceContext, trace } from "@ledgerhq/logs";
import { identifyUSBProductId } from "@ledgerhq/devices";
import { CantOpenDevice } from "@ledgerhq/errors";
import { listenDevices } from "./listenDevices";

const LOG_TYPE = "hid-verbose";

let transportInstance: TransportNodeHidSingleton | null = null;

const DISCONNECT_AFTER_INACTIVITY_TIMEOUT_MS = 5000;
let disconnectAfterInactivityTimeout: ReturnType<typeof setTimeout> | undefined;
const clearDisconnectAfterInactivityTimeout = () => {
  if (disconnectAfterInactivityTimeout) {
    clearTimeout(disconnectAfterInactivityTimeout);
  }
};

const setDisconnectAfterInactivityTimeout = () => {
  clearDisconnectAfterInactivityTimeout();
  disconnectAfterInactivityTimeout = setTimeout(
    () => TransportNodeHidSingleton.disconnectAfterInactivity(),
    DISCONNECT_AFTER_INACTIVITY_TIMEOUT_MS,
  );
};

export type ListenDescriptorEvent = DescriptorEvent<string>;

/**
 * node-hid Transport implementation
 * @example
 * import TransportNodeHid from "@ledgerhq/hw-transport-node-hid-singleton";
 * ...
 * TransportNodeHid.create().then(transport => ...)
 */
export default class TransportNodeHidSingleton extends TransportNodeHidNoEvents {
  isDisconnectAfterInactivityEnabled = true;
  // preventAutoDisconnect = false;

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
   * Disconnects singleton instance if it is not prevented from disconnecting,
   * otherwise try again after DISCONNECT_AFTER_INACTIVITY_TIMEOUT_MS.
   *
   * The prevention is handled by `preventAutoDisconnect`.
   * Currently, there is only one transport instance (for only one device connected via USB).
   *
   * Used in pair with `setDisconnectAfterInactivityTimeout`.
   *
   * Hence, once called once, the disconnection is tried at a frequency of DISCONNECT_TIMEOUT (or until `clearDisconnectAfterInactivityTimeout` is called)
   */
  static async disconnectAfterInactivity(): Promise<void> {
    trace({
      type: LOG_TYPE,
      message: "Auto Disconnecting, if not prevented",
      data: {
        hasInstance: Boolean(transportInstance),
        isDisconnectAfterInactivityEnabled: transportInstance?.isDisconnectAfterInactivityEnabled,
      },
    });

    if (transportInstance && !transportInstance.isDisconnectAfterInactivityEnabled) {
      TransportNodeHidSingleton.disconnect();
    } else if (transportInstance) {
      // If the auto-disconnect is prevented, try again in DISCONNECT_TIMEOUT
      clearDisconnectAfterInactivityTimeout();
      setDisconnectAfterInactivityTimeout();
    }
  }

  /**
   * Disconnects from the HID device associated to the transport singleton.
   *
   * If you want to try to re-use the same transport instance at the next operations (exchange for ex), you can use
   * the transport instance `close` method: it will only enable a disconnect after some inactivity.
   *
   * `disconnectAfterInactivity` will be called at a fixed frequency, and when the disconnect after some inactivity is enabled
   * it will call this `disconnect` function.
   */
  static async disconnect() {
    trace({
      type: LOG_TYPE,
      message: "Disconnecting from HID device",
      data: {
        hasInstance: Boolean(transportInstance),
      },
    });

    clearDisconnectAfterInactivityTimeout();

    if (transportInstance) {
      transportInstance.device.close();
      trace({
        type: LOG_TYPE,
        message: `Closed HID communication with device. Emitting "disconnect" event from static disconnect and clearing singleton instance.`,
      });
      transportInstance.emit("disconnect");
      transportInstance = null;
    }
  }

  /**
   * Connects to the first Ledger device connected via USB
   *
   * Reusing the same TransportNodeHidSingleton instance until a disconnection happens.
   * Pitfall: this implementation only handles 1 device connected via USB
   *
   * Legacy: `_descriptor` is needed to follow the Transport definition
   */
  static async open(
    _descriptor: string,
    _timeoutMs?: number,
    context?: TraceContext,
  ): Promise<TransportNodeHidSingleton> {
    const tracer = new LocalTracer(LOG_TYPE, context);
    clearDisconnectAfterInactivityTimeout();

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
      if (!device) throw new CantOpenDevice("No device found");

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

      const clearDeviceEventsListener = listenDevices(
        () => {},
        () => {
          // Assumes any ledger disconnection concerns current transport
          if (transportInstance) {
            tracer.trace("Listened to on remove device event. Emitting a disconnect");
            transportInstance.emit("disconnect");
          }
        },
      );

      /**
       * Disconnect event received from the transport instance.
       *
       * It could be after a disconnection coming from the HID library (e.g. device unplugged) or from the transport instance itself (e.g. close).
       * Clearing the singleton instance.
       * Currently, only 1 device at a time is supported.
       */
      const onDisconnect = () => {
        if (!transportInstance) {
          tracer.trace("disconnect event without transport instance, ignoring ...");
          return;
        }
        transportInstance.off("disconnect", onDisconnect);
        transportInstance = null;
        clearDeviceEventsListener();
      };

      transportInstance.on("disconnect", onDisconnect);
      return transportInstance;
    });
  }

  /**
   * Enables or disables the disconnection from the current HID device after some inactivity (DISCONNECT_TIMEOUT)
   */
  setEnableDisconnectAfterInactivity(isEnabled: boolean): void {
    this.tracer.trace("Setting allow disconnect after inactivity", { isEnabled });
    this.isDisconnectAfterInactivityEnabled = isEnabled;
  }

  /**
   * Exchanges with the device using APDU protocol
   *
   * @param apdu
   * @returns a promise of apdu response
   */
  async exchange(
    apdu: Buffer,
    { abortTimeoutMs }: { abortTimeoutMs?: number } = {},
  ): Promise<Buffer> {
    clearDisconnectAfterInactivityTimeout();
    const result = await super.exchange(apdu, { abortTimeoutMs });
    setDisconnectAfterInactivityTimeout();
    return result;
  }

  /**
   * Closes the transport instance by not preventing an auto-disconnection (see `disconnectAfterInactivity`).
   *
   * Intentionally not disconnecting the device/closing the hid connection directly:
   * The HID connection will only be closed after some inactivity.
   */
  async close(): Promise<void> {
    this.tracer.trace(
      "Closing transport instance by enabling the next disconnect after inactivity attempt",
      {
        previousIsDisconnectAfterInactivityEnabled: this.isDisconnectAfterInactivityEnabled,
        hasInstance: !!transportInstance,
      },
    );

    this.isDisconnectAfterInactivityEnabled = true;

    return Promise.resolve();
  }
}
