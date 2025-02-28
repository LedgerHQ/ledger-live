import Transport from "@ledgerhq/hw-transport";
import {
  DeviceId,
  DeviceManagementKit,
  type DeviceSessionState,
  DeviceStatus,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { activeDeviceSessionSubject, dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { LocalTracer, TraceContext } from "@ledgerhq/logs";
import { firstValueFrom, of, from, throwError } from "rxjs";
import { first, filter, tap, switchMap, catchError, timeout } from "rxjs/operators";
import { deviceManagementKit } from "../hooks/useDeviceManagementKit";
import type {
  Observer as TransportObserver,
  Subscription as TransportSubscription,
} from "@ledgerhq/hw-transport";
import { HwTransportError } from "../../../ledgerjs/packages/errors/lib";
import { BleManager as RNBleManager } from "react-native-ble-plx";

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
    this.tracer = tracer;
    this.listenToDisconnect();
  }

  static setLogLevel(_level: string): void {
    console.warn("setLogLevel not implemented", _level);
  }

  static observeState(
    observer: TransportObserver<{ type: string; available: boolean }>,
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
    timeoutMs?: number,
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

      const deviceSessionState: DeviceSessionState | null = await firstValueFrom(
        deviceManagementKit.getDeviceSessionState({ sessionId: activeSessionId }),
      ).catch(e => {
        tracer.trace("[SDKTransport][open] error getting device session state", e);
        return null;
      });

      if (
        deviceSessionState?.deviceStatus !== DeviceStatus.NOT_CONNECTED &&
        activeDeviceSessionSubject.value?.transport
      ) {
        tracer.trace(
          "[open] reusing existing session and instantiating a new DmkTransport",
          context,
        );
      }
    }

    if (typeof deviceOrId === "string") {
      const devicesObs = deviceManagementKit.listenToAvailableDevices();
      tracer.trace("[open] listen to available devices", context);
      console.log("listen to available devices");

      const subscription = devicesObs.pipe(
        first(devices => devices.some(device => device.id === deviceOrId)),
        switchMap(async devices => {
          const found = devices.find(device => device.id === deviceOrId);
          if (!found) {
            tracer.trace("[open] device not found in available devices");
            return undefined;
          }
          console.log("FOUND DEVICE => CONNECT", found);

          tracer.trace(`[open] device found ${found.id}`, context);

          const sessionId = await deviceManagementKit.connect({ device: found });

          const transport = new DeviceManagementKitTransport(deviceManagementKit, sessionId);
          activeDeviceSessionSubject.next({ sessionId, transport });
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
      const sessionId = await deviceManagementKit.connect({ device: deviceOrId });
      const transport = new DeviceManagementKitTransport(deviceManagementKit, sessionId);
      activeDeviceSessionSubject.next({ sessionId, transport });

      return transport;
    }

    // TODO: Handle this case
    tracer.trace("[open] no transport found");
    throw new Error("No transport found");
  }

  static listen(
    observer: TransportObserver<any, HwTransportError>,
    context?: TraceContext,
  ): TransportSubscription {
    const observable = deviceManagementKit.listenToAvailableDevices();
    let unsubscribed = false;
    tracer.trace("Listening for devices ...", context);

    const unsubscribe = () => {
      if (unsubscribed) return;
      unsubscribed = true;
      deviceManagementKit.stopDiscovering();
    };

    observable.subscribe({
      next: devices => {
        for (const device of devices) {
          const id = dmkToLedgerDeviceIdMap[device.deviceModel.model];
          tracer.trace(`[listen] device found ${device.id}`, context);
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
        this.emit("disconnect");
        subscription.unsubscribe();
      },
    });
  };

  close() {
    // this.dmk.close();
    this.dmk.stopDiscovering();
    return Promise.resolve();
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
