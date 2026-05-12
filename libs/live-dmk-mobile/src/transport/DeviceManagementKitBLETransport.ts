import Transport from "@ledgerhq/hw-transport";
import {
  DeviceId,
  DeviceManagementKit,
  type DeviceSessionState,
  DeviceStatus,
  DiscoveredDevice,
  OpeningConnectionError,
} from "@ledgerhq/device-management-kit";
import {
  PairingRefusedError,
  rnBleTransportIdentifier,
} from "@ledgerhq/device-transport-kit-react-native-ble";
import { activeDeviceSessionRegistry, dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
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
import { first, filter, tap, timeout, retry, map } from "rxjs/operators";
import { DescriptorEvent, DeviceModel } from "@ledgerhq/types-devices";
import type {
  Observer as TransportObserver,
  Subscription as TransportSubscription,
} from "@ledgerhq/hw-transport";
import { HwTransportError, PairingFailed, PeerRemovedPairing } from "@ledgerhq/errors";
import { getDeviceManagementKit } from "../hooks/useDeviceManagementKit";
import { BlePlxManager } from "./BlePlxManager";
import { isPeerRemovedPairingError } from "../errors";
import { getDeviceModel } from "@ledgerhq/devices";
import { findMatchingDiscoveredDevice, matchDeviceByName } from "../utils/matchDevicesByNameOrId";

export const tracer = new LocalTracer("live-dmk-tracer", {
  function: "DeviceManagementKitBLETransport",
});

export class DeviceManagementKitBLETransport extends Transport {
  sessionId: string;
  dmk: DeviceManagementKit;
  private registrySubscription: Subscription;
  private wasRegistered = false;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    super();
    this.sessionId = sessionId;
    this.dmk = dmk;
    this.tracer = tracer;
    this.registrySubscription = this.listenToRegistryRemoval();
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
    options?: { matchDeviceByName?: string },
  ): Promise<DeviceManagementKitBLETransport> {
    const reusableSession = activeDeviceSessionRegistry.findSession((_, connectedDevice) => {
      const isSameDeviceId =
        typeof deviceOrId === "string"
          ? connectedDevice.id === deviceOrId
          : connectedDevice.id === deviceOrId.id;
      const isSameDeviceNameButDifferentId =
        !isSameDeviceId &&
        matchDeviceByName({
          oldDevice: { deviceName: options?.matchDeviceByName },
          newDevice: { deviceName: connectedDevice.name },
        });

      return connectedDevice.type === "BLE" && (isSameDeviceId || isSameDeviceNameButDifferentId);
    });

    tracer.trace(
      "[DMKTransport] [open] activeSessionId: " +
        reusableSession?.sessionId +
        " and deviceId: " +
        deviceOrId,
      { options },
    );

    if (reusableSession) {
      tracer.trace(
        "[DMKTransport] [open] reusing existing session and instantiating a new DmkTransport",
        {
          data: {
            sessionId: reusableSession.sessionId,
            oldDevice: { deviceName: options?.matchDeviceByName },
          },
        },
      );
      return new DeviceManagementKitBLETransport(reusableSession.dmk, reusableSession.sessionId);
    }

    if (typeof deviceOrId === "string") {
      const devicesObs = getDeviceManagementKit().listenToAvailableDevices({
        transport: rnBleTransportIdentifier,
      });
      tracer.trace("[DMKTransport] [open] listen to available devices");

      const subscription = devicesObs.pipe(
        map(discoveredDevices =>
          findMatchingDiscoveredDevice(deviceOrId, options?.matchDeviceByName, discoveredDevices),
        ),
        first((device): device is DiscoveredDevice => device !== null),
        switchMap(async discoveredDevice => {
          tracer.trace(`[DMKTransport] [open] device found ${discoveredDevice.id}`);

          const sessionId = await getDeviceManagementKit()
            .connect({
              device: discoveredDevice,
              sessionRefresherOptions: { isRefresherDisabled: true },
            })
            .catch(error => {
              if (isPeerRemovedPairingError(error)) {
                // NB: remapping this error here because we need the device model info
                throw new PeerRemovedPairing(undefined, {
                  productName: getDeviceModel(
                    dmkToLedgerDeviceIdMap[discoveredDevice.deviceModel.model],
                  )?.productName,
                });
              }
              throw error;
            });
          const dmk = getDeviceManagementKit();
          activeDeviceSessionRegistry.addSession({ sessionId, dmk });
          const transport = new DeviceManagementKitBLETransport(dmk, sessionId);
          getDeviceManagementKit().stopDiscovering();

          return transport;
        }),
        retry({
          delay: (error, retryAttempt) => {
            getDeviceManagementKit().stopDiscovering();

            tracer.trace("[DMKTransport] [open2] error", error);
            if (error instanceof PairingRefusedError) {
              // NB: in LLM, we don't have a specific error for pairing refused, so we remap it to PairingFailed
              return throwError(() => new PairingFailed());
            } else if (
              error instanceof PeerRemovedPairing ||
              error instanceof OpeningConnectionError
            ) {
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
      const dmk = getDeviceManagementKit();
      activeDeviceSessionRegistry.addSession({ sessionId, dmk });
      const transport = new DeviceManagementKitBLETransport(dmk, sessionId);

      return transport;
    }
  }

  static listen(
    observer: TransportObserver<DescriptorEvent<string>, HwTransportError>,
    _context?: TraceContext,
  ): TransportSubscription {
    const observable = getDeviceManagementKit().listenToAvailableDevices({
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
            deviceModel: {
              id,
            } as DeviceModel,
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

  close() {
    this.registrySubscription.unsubscribe();
    return Promise.resolve();
  }

  disconnect(_id?: string) {
    this.dmk.disconnect({ sessionId: this.sessionId }).catch(error => {
      tracer.trace("[DMKTransport] [disconnect] error", { error });
    });
  }

  async exchange(
    apdu: Buffer,
    { abortTimeoutMs }: { abortTimeoutMs?: number } = {},
  ): Promise<Buffer> {
    return await this.dmk
      .sendApdu({
        sessionId: this.sessionId,
        apdu: new Uint8Array(apdu),
        abortTimeout: abortTimeoutMs,
      })
      .then((apduResponse: { data: Uint8Array; statusCode: Uint8Array }): Buffer => {
        const response = Buffer.from([...apduResponse.data, ...apduResponse.statusCode]);
        return response;
      })
      .catch(error => {
        throw error;
      });
  }

  private listenToRegistryRemoval(): Subscription {
    return activeDeviceSessionRegistry.subscribe(sessions => {
      const isRegistered = sessions.some(session => session.sessionId === this.sessionId);

      if (isRegistered) {
        this.wasRegistered = true;
        return;
      }

      if (this.wasRegistered) {
        this.wasRegistered = false;
        this.emit("disconnect");
      }
    });
  }
}
