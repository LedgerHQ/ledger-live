import Transport from "@ledgerhq/hw-transport";
import {
  DeviceId,
  DeviceManagementKit,
  type DeviceSessionState,
  DeviceStatus,
  DiscoveredDevice,
  OpeningConnectionError,
} from "@ledgerhq/device-management-kit";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import { activeDeviceSessionSubject, dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { LocalTracer, TraceContext } from "@ledgerhq/logs";
import {
  catchError,
  firstValueFrom,
  Observer,
  switchMap,
  from,
  throwError,
  timer,
  Subscription,
} from "rxjs";
import { first, filter, tap, timeout, retry } from "rxjs/operators";
import { DescriptorEvent } from "@ledgerhq/types-devices";
import type {
  Observer as TransportObserver,
  Subscription as TransportSubscription,
} from "@ledgerhq/hw-transport";
import { HwTransportError } from "@ledgerhq/errors";
import { getDeviceManagementKit } from "../hooks/useDeviceManagementKit";
import { BlePlxManager } from "./BlePlxManager";

export const tracer = new LocalTracer("live-dmk-tracer", {
  function: "DeviceManagementKitTransport",
});

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
    tracer.trace("setLogLevel not implemented", { level: _level });
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
    const device = getDeviceManagementKit()
      .listConnectedDevices()
      .find(device => device.id === deviceId);

    if (!device) {
      tracer.trace(
        `[DMKTransport] [disconnect] no connected device found for id ${deviceId}`,
        context,
      );
      throw new Error(`Device ${deviceId} is not connected`);
    }

    tracer.trace(`[DMKTransport] [disconnect] device found ${device.id}`, context);

    const disconnectCall$ = from(
      getDeviceManagementKit().disconnect({ sessionId: device.sessionId }),
    ).pipe(
      catchError(error => {
        tracer.trace(
          `[DMKTransport] [disconnect] error on disconnect call for ${device.id}`,
          context,
        );
        return throwError(() => error);
      }),
    );

    const waitForDisconnect$ = getDeviceManagementKit()
      .getDeviceSessionState({ sessionId: device.sessionId })
      .pipe(
        filter((state: DeviceSessionState) => state.deviceStatus === DeviceStatus.NOT_CONNECTED),
        first(),
        tap(() =>
          tracer.trace(
            `[DMKTransport] [disconnect] device ${device.id} is now disconnected`,
            context,
          ),
        ),
        timeout(10000),
      );

    return firstValueFrom(disconnectCall$.pipe(switchMap(() => waitForDisconnect$))).then(
      () => undefined,
    );
  }

  static async open(
    deviceOrId: DiscoveredDevice | string,
    _timeoutMs?: number,
    _context?: TraceContext,
  ): Promise<DeviceManagementKitTransport> {
    const activeSessionId = activeDeviceSessionSubject.value?.sessionId;

    tracer.trace(
      "[DMKTransport] [open] activeSessionId: " + activeSessionId + " and deviceId: " + deviceOrId,
    );

    if (activeSessionId) {
      tracer.trace(`[DMKTransport] [open] checking existing session ${activeSessionId}`);

      const deviceSessionState: DeviceSessionState | null = await firstValueFrom(
        getDeviceManagementKit().getDeviceSessionState({ sessionId: activeSessionId }),
      ).catch(e => {
        tracer.trace("[open] error getting device session state", { error: e });
        return null;
      });

      const connectedDevice = getDeviceManagementKit().getConnectedDevice({
        sessionId: activeSessionId,
      });

      if (
        deviceSessionState?.deviceStatus !== DeviceStatus.NOT_CONNECTED &&
        activeDeviceSessionSubject.value?.transport &&
        connectedDevice.id === deviceOrId
      ) {
        tracer.trace(
          "[DMKTransport] [open] reusing existing session and instantiating a new DmkTransport",
        );

        return activeDeviceSessionSubject.value.transport;
      }
    }

    if (typeof deviceOrId === "string") {
      const devicesObs = getDeviceManagementKit().listenToAvailableDevices({
        transport: rnBleTransportIdentifier,
      });
      tracer.trace("[DMKTransport] [open] listen to available devices");

      const subscription = devicesObs.pipe(
        first(devices => devices.some(device => device.id === deviceOrId)),
        switchMap(async devices => {
          const found = devices.find(device => device.id === deviceOrId)!;

          tracer.trace(`[DMKTransport] [open] device found ${found.id}`);

          await getDeviceManagementKit().close();
          const sessionId = await getDeviceManagementKit().connect({
            device: found,
            sessionRefresherOptions: { isRefresherDisabled: true },
          });
          const transport = new DeviceManagementKitTransport(getDeviceManagementKit(), sessionId);

          activeDeviceSessionSubject.next({ sessionId, transport });
          getDeviceManagementKit().stopDiscovering();

          return transport;
        }),
        retry({
          delay: (error, retryAttempt) => {
            getDeviceManagementKit().stopDiscovering();

            tracer.trace("[DMKTransport] [open2] error", error);
            if (error instanceof OpeningConnectionError) {
              return throwError(() => error);
            }

            if (retryAttempt < 5) {
              return timer(500);
            }

            return throwError(() => error);
          },
        }),
      );

      try {
        const transport = await firstValueFrom(subscription);
        if (!transport) {
          throw new Error("No transport found");
        }
        return transport;
      } catch (error) {
        tracer.trace("[DMKTransport] [open2] error", { error });
        throw error;
      }
    } else {
      await getDeviceManagementKit().close();
      const sessionId = await getDeviceManagementKit().connect({
        device: deviceOrId,
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
      const transport = new DeviceManagementKitTransport(getDeviceManagementKit(), sessionId);
      activeDeviceSessionSubject.next({ sessionId, transport });

      return transport;
    }
  }

  static listen(
    observer: TransportObserver<DescriptorEvent<string>, HwTransportError>,
    _context?: TraceContext,
  ): TransportSubscription {
    const observable = getDeviceManagementKit().listenToAvailableDevices({
      // TODO: anticipating the need to filter by transport
      transport: rnBleTransportIdentifier,
    });
    let subscription: Subscription | undefined = undefined;

    subscription = observable.subscribe({
      next: devices => {
        for (const device of devices) {
          const id = dmkToLedgerDeviceIdMap[device.deviceModel.model];
          observer.next({
            type: "add",
            descriptor: "",
            device: device,
            // @ts-expect-error types don't match with current implementation
            deviceModel: {
              id,
            },
          });
        }
      },
      complete: observer.complete,
      error: err => {
        tracer.trace("[DMKTransport] [listen] error", err);
        observer.error(err);
        if (subscription) {
          subscription.unsubscribe();
        }
      },
    });
    const unsubscribe = () => {
      if (!subscription || subscription.closed) return;
      subscription.unsubscribe();
      getDeviceManagementKit().stopDiscovering();
    };

    return {
      unsubscribe,
    };
  }

  listenToDisconnect = () => {
    let subscription: Subscription | undefined = undefined;
    subscription = this.dmk.getDeviceSessionState({ sessionId: this.sessionId }).subscribe({
      next: (state: { deviceStatus: DeviceStatus }) => {
        if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
          this.tracer.trace(
            "[DMKTransport] [listenToDisconnect] Device disconnected, closing transport",
          );

          if (activeDeviceSessionSubject.value?.sessionId === this.sessionId) {
            activeDeviceSessionSubject.next(null);
          }
          this.emit("disconnect");
        }
      },
      error: (error: unknown) => {
        this.tracer.trace("[DMKTransport] [listenToDisconnect] error", { error });
        this.emit("disconnect");
        if (subscription) {
          subscription.unsubscribe();
        }
      },
      complete: () => {
        this.tracer.trace("[DMKTransport] [listenToDisconnect] Complete");
        this.emit("disconnect");
        if (subscription) {
          subscription.unsubscribe();
        }
      },
    });
    return subscription;
  };

  close() {
    return Promise.resolve();
  }

  disconnect(_id?: string) {
    try {
      this.dmk.disconnect({ sessionId: this.sessionId });
    } catch (error) {
      tracer.trace("[DMKTransport] [disconnect] error", { error });
    }
  }

  async exchange(
    apdu: Buffer,
    { abortTimeoutMs }: { abortTimeoutMs?: number } = {},
  ): Promise<Buffer> {
    const activeSessionId = activeDeviceSessionSubject.value?.sessionId;
    if (!activeSessionId) {
      throw new Error("No active session found");
    }
    tracer.trace(`=> ${apdu.toString("hex")}`);

    return await this.dmk
      .sendApdu({
        sessionId: activeSessionId,
        apdu: new Uint8Array(apdu),
        abortTimeout: abortTimeoutMs,
      })
      .then((apduResponse: { data: Uint8Array; statusCode: Uint8Array }): Buffer => {
        const response = Buffer.from([...apduResponse.data, ...apduResponse.statusCode]);
        tracer.trace(`<= ${response.toString("hex")}`);
        return response;
      })
      .catch(error => {
        tracer.trace("[Error][exchange] ", { error });
        throw error;
      });
  }
}
