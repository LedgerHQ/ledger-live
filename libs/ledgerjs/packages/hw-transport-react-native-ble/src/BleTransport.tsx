import { AppState, NativeModules, NativeEventEmitter } from "react-native";
import Transport, {
  DescriptorEvent,
  Device,
  Observer,
  Subscription,
} from "@ledgerhq/hw-transport";
import {
  PairingFailed,
  TransportError,
  BluetoothRequired,
  CantOpenDevice,
  NetworkDown,
} from "@ledgerhq/errors";
import type { RawRunnerEvent, RunnerEvent, GlobalBridgeEvent } from "./types";
import { log } from "@ledgerhq/logs";
import { type EventSubscription } from "react-native/Libraries/vendor/emitter/EventEmitter";

const NativeBle = NativeModules.HwTransportReactNativeBle;

let runningQueue = false;
let instances: Array<Ble> = [];

export const isRunningBIMQueue = (): boolean => !!runningQueue;

class Ble extends Transport {
  static scanObserver: Observer<DescriptorEvent<any>>;
  static stateObserver: Observer<{ type: string }>;
  static globalBridgeEventSubscription: EventSubscription;
  static disconnecting = false;

  queueObserver: Observer<RunnerEvent> | undefined;
  appStateSubscription: EventSubscription;
  bridgeEventSubscription: EventSubscription;

  transportId = "BleTransport";
  appState: "background" | "active" | "inactive" | "" = "";
  id: string;

  static log(...m: string[]): void {
    const tag = "ble-verbose";
    log(tag, JSON.stringify([...m]));
  }

  constructor(deviceId: string) {
    super();
    const eventEmitter = new NativeEventEmitter(
      NativeModules.HwTransportReactNativeBle
    );

    this.id = deviceId;
    this.queueObserver;
    this.appStateSubscription = AppState.addEventListener(
      "change",
      this.onAppStateChanged
    );
    this.bridgeEventSubscription = eventEmitter.addListener(
      "BleTransport",
      this.onBridgeEvent
    );

    instances.push(this);
    Ble.log(`BleTransport(${String(this.id)})   `);
  }

  private onAppStateChanged = (state) => {
    if (this.appState !== state) {
      Ble.log("appstate change detected", state);
      this.appState = state;
      NativeBle.onAppStateChange(state === "active");
    }
  };

  exchange = async (apdu: Buffer): Promise<Buffer> => {
    Ble.log("apdu", `=> ${apdu.toString("hex")}`);
    try {
      const response = await NativeBle.exchange(apdu.toString("hex"));
      Ble.log("apdu", `<= ${response}`);
      return Buffer.from(`${response}`, "hex");
    } catch (error) {
      Ble.log("error");
      throw Ble.remapError(error);
    }
  };

  queue = (
    observer: Observer<RunnerEvent>,
    rawQueue: string,
    endpoint: string
  ): void => {
    if (!endpoint) throw new Error("No endpoint provided for BIM");

    Ble.log("request to launch queue", rawQueue);
    this.queueObserver = observer;
    NativeBle.queue(rawQueue, endpoint);
    runningQueue = true; // TODO there probably is a cleaner way of doing this.
  };

  private onBridgeEvent = (rawEvent: RawRunnerEvent) => {
    const { event, type, data } = rawEvent;
    Ble.log("raw bridge", JSON.stringify(rawEvent));
    if (!this.queueObserver || event !== "task") return;

    if (type === "runComplete") {
      // we've completed a queue, complete the subject
      this.queueObserver.complete();
      runningQueue = false;
    } else if (type === "runError") {
      this.queueObserver.error(Ble.remapError(data.message));
      runningQueue = false;
    } else {
      const progress = Math.round((data?.progress || 0) * 100) / 100;
      this.queueObserver.next({
        type,
        appOp: { name: data.name, type: data.type },
        progress: type === "runProgress" ? progress || 0 : undefined,
      });
    }
  };

  static onBridgeGlobalEvent(rawEvent: GlobalBridgeEvent): void {
    const { event, type, data } = rawEvent;
    Ble.log("raw global bridge", JSON.stringify(rawEvent));
    // For Device events we need to polyfill the model since it's expected
    // throughout our codebase. We do this based on the serviceUUID from
    // the descriptor.
    if (event === "replace") {
      // A replace is here mapped to multiple events:
      //  - flushing the existing devices
      //  - emit the new ones as `add` events.
      Ble.scanObserver?.next({ type: "flush" });
      data.devices.forEach((descriptor) => {
        Ble.scanObserver?.next({
          type: "add",
          descriptor,
        });
      });
    } else if (event === "add") {
      Ble.scanObserver?.next({
        type: "add",
        descriptor: data,
      });
    } else if (event === "status") {
      if (Ble.stateObserver) {
        Ble.stateObserver.next({
          type,
        });
      }
    }
  }

  static open = async (deviceOrId: Device | string): Promise<Ble> => {
    const uuid = typeof deviceOrId === "string" ? deviceOrId : deviceOrId.id;

    if (await NativeBle.isConnected()) {
      Ble.log("disconnect first");
      await Ble.disconnect();
    }

    try {
      const _uuid = await NativeBle.connect(uuid);
      Ble.log(`connected to (${_uuid})`);
      return new Ble(_uuid);
    } catch (error) {
      Ble.log("failed to connect to device");
      throw Ble.remapError(error, { uuid });
      Ble.disconnect();
    }
  };

  static observeState = (
    observer: Observer<{ type: string }>
  ): Subscription => {
    Ble.stateObserver = observer;
    NativeBle.observeBluetooth(); // Nb currently we are still relying on the RequiresBluetooth cmp

    AppState.addEventListener("change", (state) => {
      NativeBle.onAppStateChange(state === "active");
    });

    return {
      unsubscribe: () => {
        observer.complete;
      },
    };
  };

  static listen = (
    observer: Observer<DescriptorEvent<unknown>>
  ): Subscription => {
    Ble.scanObserver = observer;
    const eventEmitter = new NativeEventEmitter(
      NativeModules.HwTransportReactNativeBle
    );

    Ble.globalBridgeEventSubscription = eventEmitter.addListener(
      "BleTransport",
      Ble.onBridgeGlobalEvent
    );

    NativeBle.listen()
      .then(() => {
        Ble.log("Start scanning devices");
      })
      .catch((error) => {
        Ble.log("Bluetooth is not available! :ohgod:");
        observer.error(Ble.remapError(error));
      });

    return { unsubscribe: Ble.stop };
  };

  private static stop = async (): Promise<void> => {
    Ble.globalBridgeEventSubscription?.remove();
    await NativeBle.stop();
    Ble.log("Stop scanning devices");
  };

  close = async (): Promise<void> => {
    Ble.log("close");
    await Ble.disconnect();
    return;
  };

  static disconnect = async (): Promise<boolean> => {
    if (Ble.disconnecting) {
      Ble.log("already disconnecting, skipping disconnect");
      return true;
    }

    Ble.disconnecting = true;
    Ble.log("disconnecting, and removing listeners");

    instances.forEach((instance) => {
      instance.appStateSubscription?.remove();
      instance.bridgeEventSubscription?.remove();
      instance.queueObserver?.complete();
    });
    instances = [];
    runningQueue = false;

    await NativeBle.disconnect();
    Ble.disconnecting = false;
    Ble.log("disconnected");
    return true;
  };

  private static remapError = (error: any, extras?: unknown) => {
    const mappedErrors = {
      "pairing-failed": PairingFailed,
      "bluetooth-required": BluetoothRequired,
      "cant-open-device": CantOpenDevice,
      "network-down": NetworkDown,
    };

    if (error?.code in mappedErrors)
      return new mappedErrors[error?.code](extras);
    return new TransportError(error?.code, error);
  };

  /// Long running tasks below, buckle up, queues use runners internally
  /// whereas the firmware update may just use runners, tbd
  static runner = (url: string): void => {
    Ble.log(`request to launch runner for url ${url}`);
    NativeBle.runner(url);
  };
}

export default Ble;
