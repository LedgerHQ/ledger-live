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
  static scanObserver: Observer<DescriptorEvent<any>> | undefined;
  static stateObserver: Observer<{ type: string }> | undefined;

  static globalBridgeEventSubscription: EventSubscription;
  static globalAppStateSubscription: EventSubscription;
  static disconnecting = false;

  queueObserver: Observer<RunnerEvent> | undefined;
  bridgeEventSubscription: EventSubscription;

  transportId = "BleTransport";
  id: string;

  static log(...m: string[]): void {
    const tag = "ble-verbose";
    log(tag, JSON.stringify([...m]));
  }

  /**
   * Making this call as early as possible, in the live-common-setup file allows us
   * to avoid the cases where we start emitting events without having a registered
   * listener.
   */
  static setGlobalListener(): void {
    const eventEmitter = new NativeEventEmitter(
      NativeModules.HwTransportReactNativeBle
    );

    Ble.log("Registering for global bridge events");
    Ble.globalBridgeEventSubscription?.remove();
    Ble.globalBridgeEventSubscription = eventEmitter.addListener(
      "BleTransport",
      Ble.onBridgeGlobalEvent
    );

    Ble.log("Registering for app state changes");
    Ble.globalAppStateSubscription?.remove();
    Ble.globalAppStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        NativeBle.onAppStateChange(state === "active");
      }
    );
  }

  constructor(deviceId: string) {
    super();
    this.id = deviceId;
    if (!Ble.globalBridgeEventSubscription) {
      Ble.log("Call BleTransport.setGlobalListener in live-common-setup.");
      Ble.setGlobalListener();
    }

    instances.push(this);
    Ble.log(`BleTransport(${String(this.id)})   `);
  }

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

  private onBridgeEvent = (rawEvent: RawRunnerEvent) => {
    const { event, type, data } = rawEvent;
    Ble.log("raw bridge", JSON.stringify(rawEvent));
    if (!this.queueObserver || event !== "task") return;

    switch (type) {
      case "runComplete":
        this.queueObserver.complete();
        runningQueue = false;
        break;

      case "runError":
        this.queueObserver.error(Ble.remapError(data));
        this.queueObserver = undefined;
        runningQueue = false;
        break;

      case "runSuccess":
      case "runStart":
        this.queueObserver.next({
          type,
          appOp: { name: data.name, type: data.type },
        });
        break;

      case "runProgress": {
        const progress = Math.round((data?.progress || 0) * 100) / 100;
        this.queueObserver.next({
          type,
          appOp: { name: data.name, type: data.type },
          progress,
        });
        break;
      }

      case "runBulkProgress":
        this.queueObserver.next({
          type: "bulk-progress",
          progress: data.progress,
          index: data.index,
          total: data.total,
        });
        break;
    }
  };

  static onBridgeGlobalEvent(rawEvent: GlobalBridgeEvent): void {
    const { event, type, data } = rawEvent;
    Ble.log("raw global bridge", JSON.stringify(rawEvent));
    instances.forEach((instance) => {
      instance.onBridgeEvent(rawEvent as unknown as RawRunnerEvent);
    });

    switch (event) {
      case "replace": {
        Ble.scanObserver?.next({ type: "flush" });
        data.devices.forEach((descriptor) => {
          Ble.scanObserver?.next({
            type: "add",
            descriptor,
          });
        });
        break;
      }

      case "status": {
        Ble.stateObserver?.next({
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
      Ble.disconnect();
      throw Ble.remapError(error, { uuid });
    }
  };

  static observeState = (
    observer: Observer<{ type: string }>
  ): Subscription => {
    Ble.stateObserver = observer;
    NativeBle.observeBluetooth(); // Nb currently we are still relying on the RequiresBluetooth cmp

    return {
      unsubscribe: () => {
        observer.complete;
      },
    };
  };

  static listen = (
    observer: Observer<DescriptorEvent<unknown>>
  ): Subscription => {
    if (!Ble.globalBridgeEventSubscription) {
      Ble.log("Call BleTransport.setGlobalListener in live-common-setup.");
      Ble.setGlobalListener();
    }

    Ble.scanObserver = observer;
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

  static stop = async (): Promise<void> => {
    Ble.scanObserver = undefined;

    await NativeBle.stop();
    Ble.log("Stop scanning devices");
  };

  close = async (): Promise<void> => {
    Ble.log("close");
    await Ble.disconnect();
    return;
  };

  static disconnect = async (): Promise<boolean> => {
    if (!instances.length) {
      Ble.log("already disconnected");
      return true;
    }
    if (Ble.disconnecting) {
      Ble.log("disconnecting, give it a second and try again");
      const promise = new Promise<boolean>((resolve) => {
        setTimeout(
          () =>
            Ble.disconnect().then(() => {
              resolve(true);
            }),
          1000
        );
      });
      return promise;
    }

    Ble.disconnecting = true;
    Ble.log("disconnecting, and removing listeners");

    instances.forEach((instance) => {
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

  static remapError = (error: any, extras?: unknown): Error => {
    Ble.log(`raw error data ${JSON.stringify(error)}`);

    const mappedErrors = {
      "pairing-failed": PairingFailed,
      "bluetooth-required": BluetoothRequired,
      "cant-open-device": CantOpenDevice,
      "network-down": NetworkDown,
    };

    if (error?.code in mappedErrors)
      return new mappedErrors[error?.code](extras);

    if (error?.error in mappedErrors)
      return new mappedErrors[error?.error](extras);

    return new TransportError(error?.code, error);
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
    runningQueue = true;
  };

  runner = (observer: Observer<RunnerEvent>, url: string): void => {
    Ble.log(`request to launch runner for url ${url}`);
    this.queueObserver = observer;
    NativeBle.runner(url);
  };
}

export default Ble;
