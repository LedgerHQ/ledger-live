import Transport from "@ledgerhq/hw-transport";
import {
  DeviceId,
  DeviceManagementKit,
  type DeviceSessionState,
  DeviceStatus,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
// import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import { activeDeviceSessionSubject, dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { LocalTracer, TraceContext } from "@ledgerhq/logs";
import { catchError, firstValueFrom, Observer, of, switchMap, from, throwError } from "rxjs";
import { first, filter, tap, timeout } from "rxjs/operators";
import { deviceManagementKit } from "../hooks/useDeviceManagementKit";
import type {
  Observer as TransportObserver,
  Subscription as TransportSubscription,
} from "@ledgerhq/hw-transport";
import { BleManager as RNBleManager } from "react-native-ble-plx";
import { HwTransportError } from "../../../ledgerjs/packages/errors/lib";

class BlePlxManager {
  private static _instance: RNBleManager;

  static get instance(): RNBleManager {
    if (!this._instance) {
      this._instance = new RNBleManager();
    }
    return this._instance;
  }

  static onStateChange(listener: (state: string) => void, emitCurrentState?: boolean) {
    return this.instance.onStateChange(listener, emitCurrentState);
  }
}

const tracer = new LocalTracer("live-dmk", { function: "DeviceManagementKitTransport" });

export class DeviceManagementKitTransport extends Transport {
  sessionId: string;
  dmk: DeviceManagementKit;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    super();
    this.sessionId = sessionId;
    this.dmk = dmk;
    this.listenToDisconnect();
    this.tracer = tracer;
  }

  static setLogLevel(_level: string): void {
    console.warn("setLogLevel not implemented", _level);
  }

  static observeState(
    observer: Observer<{ type: string; available: boolean }>,
  ): TransportSubscription {
    const subscription = BlePlxManager.instance.onStateChange((type: string) => {
      observer.next({
        type,
        available: type === "PoweredOn",
      });
    }, true);
    return {
      unsubscribe: () => subscription.remove(),
    };
  }

  static async disconnectDevice(deviceId: DeviceId, context?: TraceContext): Promise<void> {
    const device = deviceManagementKit
      .listConnectedDevices()
      .find(device => device.id === deviceId);

    if (!device) {
      tracer.trace(`[disconnect] no connected device found for id ${deviceId}`, context);
      throw new Error(`Device ${deviceId} is not connected`);
    }

    tracer.trace(`[disconnect] device found ${device.id}`, context);
    console.warn("FOUND CONNECTED DEVICE => DISCONNECT", device);

    const disconnectCall$ = from(
      deviceManagementKit.disconnect({ sessionId: device.sessionId }),
    ).pipe(
      catchError(error => {
        tracer.trace(`[disconnect] error on disconnect call for ${device.id}`, context);
        return throwError(() => error);
      }),
    );

    const waitForDisconnect$ = deviceManagementKit
      .getDeviceSessionState({ sessionId: device.sessionId })
      .pipe(
        filter((state: DeviceSessionState) => state.deviceStatus === DeviceStatus.NOT_CONNECTED),
        first(),
        tap(() => tracer.trace(`[disconnect] device ${device.id} is now disconnected`, context)),
        timeout(10000),
      );

    return firstValueFrom(disconnectCall$.pipe(switchMap(() => waitForDisconnect$))).then(
      () => undefined,
    );
  }

  static async open(
    deviceOrId: DiscoveredDevice | string,
    _timeoutMs?: number,
    context?: TraceContext,
  ): Promise<DeviceManagementKitTransport> {
    const activeSessionId = activeDeviceSessionSubject.value?.sessionId;

    tracer.trace(
      "[open] activeSessionId: " + activeSessionId + " and deviceId: " + deviceOrId,
      context,
    );
    console.log(
      "[open] activeSessionId: " + activeSessionId + " and deviceId: " + deviceOrId,
      context,
    );

    if (activeSessionId) {
      tracer.trace(`[open] checking existing session ${activeSessionId}`);
      console.log("[open] checking existing session " + activeSessionId);

      const deviceSessionState: DeviceSessionState | null = await firstValueFrom(
        deviceManagementKit.getDeviceSessionState({ sessionId: activeSessionId }),
      ).catch(e => {
        tracer.trace(
          "[open] reusing existing session and instantiating a new DmkTransport",
          context,
        );
        console.log(
          "[DeviceManagementKitTransport][open] error getting device session state",
          e,
          context,
        );
        return null;
      });

      console.log("[open] deviceSessionState", deviceSessionState, context);

      if (
        deviceSessionState?.deviceStatus !== DeviceStatus.NOT_CONNECTED &&
        activeDeviceSessionSubject.value?.transport
      ) {
        tracer.trace(
          "[open] reusing existing session and instantiating a new DmkTransport",
          context,
        );
        console.log(
          "[open] reusing existing session and instantiating a new DmkTransport",
          context,
        );
        return activeDeviceSessionSubject.value.transport;
      }
    }

    console.log("[open] typeof deviceOrId", typeof deviceOrId, context);

    if (typeof deviceOrId === "string") {
      console.log("[open]listen to available devices", context);
      const devicesObs = deviceManagementKit.listenToAvailableDevices({});
      tracer.trace("[open] listen to available devices", context);

      const subscription = devicesObs.pipe(
        first(devices => devices.some(device => device.id === deviceOrId)),
        switchMap(async devices => {
          const found = devices.find(device => device.id === deviceOrId);
          if (!found) {
            console.log(
              "[DeviceManagementKitTransport][open] device not found in available devices",
              devices,
              context,
            );
            tracer.trace("[open] device not found in available devices", context);
            throw new Error("Device not found");
          }
          console.log("FOUND DEVICE => CONNECT", found, context);

          console.log("[DeviceManagementKitTransport][open] device found", found, context);
          tracer.trace(`[open] device found ${found.id}`, context);

          const sessionId = await deviceManagementKit.connect({ device: found });
          console.log("[DeviceManagementKitTransport][open] sessionId", sessionId, context);
          const transport = new DeviceManagementKitTransport(deviceManagementKit, sessionId);
          activeDeviceSessionSubject.next({ sessionId, transport });
          console.log(
            "[DeviceManagementKitTransport][open] toggle device session refresher",
            context,
          );
          deviceManagementKit.disableDeviceSessionRefresher({
            sessionId,
            blockerId: "[transport] DeviceManagementKitTransport LLM",
          });
          console.log("[DeviceManagementKitTransport][open] stop discovering", context);
          deviceManagementKit.stopDiscovering();

          return transport;
        }),
        catchError(error => {
          console.error("[open] error", error);
          deviceManagementKit.stopDiscovering();
          return of(undefined);
        }),
      );

      const transport = await firstValueFrom(subscription);

      if (transport) {
        return transport;
      }
    } else {
      console.log("[DeviceManagementKitTransport][open] connecting to device", deviceOrId, context);
      const sessionId = await deviceManagementKit.connect({ device: deviceOrId });
      console.log("[DeviceManagementKitTransport][open] sessionId", sessionId, context);
      const transport = new DeviceManagementKitTransport(deviceManagementKit, sessionId);

      console.log("[DeviceManagementKitTransport][open] toggle device session refresher", context);
      deviceManagementKit.disableDeviceSessionRefresher({
        sessionId,
        blockerId: "[transport] DeviceManagementKitTransport LLM",
      });

      activeDeviceSessionSubject.next({ sessionId, transport });

      return transport;
    }

    // TODO: Handle this case
    tracer.trace("[open] no transport found", context);
    throw new Error("No transport found");
  }

  static listen(
    observer: TransportObserver<any, HwTransportError>,
    context?: TraceContext,
  ): TransportSubscription {
    const observable = deviceManagementKit.listenToAvailableDevices({
      // TODO: anticipating the need to filter by transport
      // transport: rnBleTransportIdentifier,
    });
    let unsubscribed = false;

    const unsubscribe = () => {
      if (unsubscribed) return;
      unsubscribed = true;
      deviceManagementKit.stopDiscovering();
    };

    observable.subscribe({
      next: devices => {
        for (const device of devices) {
          const id = dmkToLedgerDeviceIdMap[device.deviceModel.model];
          observer.next({
            type: "add",
            descriptor: "",
            device: device,
            deviceModel: {
              id,
            },
          });
        }
        console.log(devices);
        console.log("[DeviceManagementKitTransport][listen] devices", devices, context);
      },
      complete: observer.complete,
      error: err => {
        unsubscribe();
        tracer.trace("[listen] error", err);
        observer.error(err);
      },
    });
    return {
      unsubscribe,
    };
  }

  listenToDisconnect = () => {
    const subscription = this.dmk.getDeviceSessionState({ sessionId: this.sessionId }).subscribe({
      next: (state: { deviceStatus: DeviceStatus }) => {
        if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
          console.log(
            "[DeviceManagementKitTransport][listenToDisconnect] Device disconnected, closing transport",
          );
          this.tracer.trace("[listenToDisconnect] Device disconnected, closing transport");
          activeDeviceSessionSubject.next(null);
          this.emit("disconnect");
        }
      },
      error: (error: unknown) => {
        console.error("[listenToDisconnect] error", error);
        this.emit("disconnect");
        subscription.unsubscribe();
      },
      complete: () => {
        this.tracer.trace("[listenToDisconnect] Complete");
        console.log("[listenToDisconnect] Complete");
        this.emit("disconnect");
        subscription.unsubscribe();
      },
    });
  };

  close() {
    console.log("[close]");
    // this.dmk.stopDiscovering();
    return Promise.resolve();
  }

  disconnect(id?: string) {
    if (id) {
      console.log("[disconnect] id", id);
    }
    try {
      this.dmk.disconnect({ sessionId: this.sessionId });
    } catch (error) {
      console.error("[disconnect] error", error);
    }
  }

  async exchange(
    apdu: Buffer,
    { abortTimeoutMs: _abortTimeoutMs }: { abortTimeoutMs?: number } = {},
  ): Promise<Buffer> {
    const activeSessionId = activeDeviceSessionSubject.value?.sessionId;
    if (!activeSessionId) {
      throw new Error("No active session found");
    }
    return await this.dmk
      .sendApdu({
        sessionId: activeSessionId,
        apdu: new Uint8Array(apdu),
      })
      .then((apduResponse: { data: Uint8Array; statusCode: Uint8Array }): Buffer => {
        const response = Buffer.from([...apduResponse.data, ...apduResponse.statusCode]);
        tracer.trace(`[exchange] <= ${response.toString("hex")}`);
        return response;
      })
      .catch(e => {
        console.error("[exchange] error", e);
        throw e;
      });
  }
}
