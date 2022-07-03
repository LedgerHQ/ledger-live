import { AppState, NativeModules } from "react-native";
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
} from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { type EventSubscription } from "react-native/Libraries/vendor/emitter/EventEmitter";
import EventEmitter from "./EventEmitter";

const NativeBle = NativeModules.HwTransportReactNativeBle;

let instances: Array<Ble> = [];
type RunnerEvent = any; // Can't depend on live-common for this, TODO get it from types package

class Ble extends Transport {
  static scanObserver: Observer<DescriptorEvent<unknown>>;
  static stateObserver: Observer<{ type: string }>;
  static globalBridgeEventSubscription: EventSubscription;

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
    this.id = deviceId;
    this.queueObserver;
    this.appStateSubscription = AppState.addEventListener(
      "change",
      this.onAppStateChanged
    );
    this.bridgeEventSubscription = EventEmitter?.addListener(
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

  queue = (observer: Observer<any>, token: string, endpoint: string): void => {
    if (!endpoint) throw new Error("No endpoint provided for BIM");

    Ble.log("request to launch queue", token);
    this.queueObserver = observer;
    NativeBle.queue(token, endpoint);
    // Regarding ↑ there's a bug in this rn version that breaks the mapping
    // between a number on the JS side and Swift. To preserve my sanity, we
    // are using string in the meantime since it's not a big deal.
  };

  private onBridgeEvent = (rawEvent) => {
    const { event, type, data } = JSON.parse(rawEvent);
    if (event === "task") {
      if (this.queueObserver) {
        if (type === "runComplete") {
          // we've completed a queue, complete the subject
          this.queueObserver.complete();
        } else if (type === "runError") {
          this.queueObserver.next({
            type: "runError",
            appOp: {}, //Fixme?
            error: Ble.remapError(data.code),
          });
          this.queueObserver.complete();
        } else {
          const progress = Math.round((data?.progress || 0) * 100) / 100;
          this.queueObserver.next({
            type,
            appOp: { name: data.name, type: data.type },
            progress: type === "runProgress" ? progress || 0 : undefined,
          });
        }
      }
    }
  };

  static onBridgeGlobalEvent(rawEvent): void {
    const { event, type, data } = JSON.parse(rawEvent);
    if (event === "new-device") {
      console.log("BIMBIM new device ", data);
      Ble.scanObserver?.next({
        type: "add",
        descriptor: {
          id: data.uuid,
          name: data.name,
          rssi: data.rssi,
          serviceUUIDs: [data.service],
        },
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
      const _uuid = await NativeBle.connect(uuid, "no_longer_used");
      Ble.log(`connected to (${_uuid})`);
      return new Ble(_uuid);
    } catch (error) {
      Ble.log("failed to connect to device");
      throw Ble.remapError(error, { uuid });
      Ble.disconnect();
    }
  };

  // close = async (): Promise<void> => {
  //   return new Promise<void>((resolve) => {
  //     Ble.log("close connection");
  //     Ble.disconnect().then((_) => resolve());
  //   });
  // };

  static observeState = (
    observer: Observer<{ type: string }>
  ): Subscription => {
    Ble.stateObserver = observer;
    NativeBle.observeBluetooth();

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
    Ble.globalBridgeEventSubscription = EventEmitter?.addListener(
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

  static disconnect = async (): Promise<boolean> => {
    console.trace();
    Ble.log("disconnecting, and removing listeners");

    instances.forEach((instance) => {
      instance.appStateSubscription?.remove();
      instance.bridgeEventSubscription?.remove();
      instance.queueObserver?.complete();
    });
    instances = [];

    await NativeBle.disconnect();
    Ble.log("disconnected");
    return true;
  };

  private static remapError = (error: any, extras?: unknown) => {
    const mappedErrors = {
      "pairing-failed": PairingFailed,
      "bluetooth-required": BluetoothRequired,
      "cant-open-device": CantOpenDevice,
    };

    if (error?.code in mappedErrors)
      return new mappedErrors[error?.code](extras);
    return new TransportError(error?.code, error);
  };

  /// Long running tasks below, buckle up.
  static runner = (url: string): void => {
    Ble.log(`request to launch runner for url ${url}`);
    NativeBle.runner(url);
  };
}

export default Ble;
