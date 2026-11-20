import Transport, {
  type DescriptorEvent,
  type Observer as TransportObserver,
  type Subscription as TransportSubscription,
} from "@ledgerhq/hw-transport";
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
import { first, filter, tap, timeout, retry, map } from "rxjs/operators";
import { HwTransportError } from "@ledgerhq/hw-transport/errors";
import { PairingFailed, PeerRemovedPairing, isPeerRemovedPairingError } from "../errors";
import { getDeviceManagementKit } from "../hooks/useDeviceManagementKit";
import { BlePlxManager } from "./BlePlxManager";
import { getDeviceModel } from "@ledgerhq/devices";
import { findMatchingDiscoveredDevice, matchDeviceByName } from "../utils/matchDevicesByNameOrId";

export const tracer = new LocalTracer("live-dmk-tracer", {
  function: "DeviceManagementKitBLETransport",
});

export class DeviceManagementKitBLETransport extends Transport {
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

  /**
   * Reuses the session a DMK flow opened. Without it, the scan below finds the connected device
   * and opens a second session on the same link. A session matches by id, which does not change
   * during a session. The published session also matches by name, as before: an OS update changes
   * the BLE address. `exchange` reads `activeDeviceSessionSubject`, so a reused session that is
   * not published yet is published there.
   */
  private static reuseConnectedSession(
    deviceId: string,
    deviceName: string | undefined,
  ): DeviceManagementKitBLETransport | null {
    const dmk = getDeviceManagementKit();
    const activeDeviceSession = activeDeviceSessionSubject.value;
    const connectedBleDevices = dmk
      .listConnectedDevices()
      .filter(device => device.transport === rnBleTransportIdentifier);
    const matchingDevice =
      connectedBleDevices.find(device => device.id === deviceId) ??
      connectedBleDevices.find(
        device =>
          device.sessionId === activeDeviceSession?.sessionId &&
          matchDeviceByName({
            oldDevice: { deviceName },
            newDevice: { deviceName: device.name },
          }),
      );

    if (!matchingDevice) {
      tracer.trace("[DMKTransport] [open] no connected device to reuse", {
        data: { deviceId, connectedDeviceIds: connectedBleDevices.map(device => device.id) },
      });
      return null;
    }

    const { sessionId } = matchingDevice;
    tracer.trace("[DMKTransport] [open] reusing the session of a connected device", {
      data: { deviceId, connectedDeviceId: matchingDevice.id, sessionId },
    });
    if (activeDeviceSession?.sessionId === sessionId) {
      return activeDeviceSession.transport;
    }
    const transport = new DeviceManagementKitBLETransport(dmk, sessionId);
    activeDeviceSessionSubject.next({ sessionId, transport });
    return transport;
  }

  static async open(
    deviceOrId: DiscoveredDevice | string,
    _timeoutMs?: number,
    _context?: TraceContext,
    options?: { matchDeviceByName?: string },
  ): Promise<DeviceManagementKitBLETransport> {
    const activeSessionId = activeDeviceSessionSubject.value?.sessionId;

    tracer.trace(
      "[DMKTransport] [open] activeSessionId: " + activeSessionId + " and deviceId: " + deviceOrId,
      { options },
    );

    if (typeof deviceOrId === "string") {
      const connectedTransport = DeviceManagementKitBLETransport.reuseConnectedSession(
        deviceOrId,
        options?.matchDeviceByName,
      );
      if (connectedTransport) {
        return connectedTransport;
      }

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
          const transport = new DeviceManagementKitBLETransport(
            getDeviceManagementKit(),
            sessionId,
          );

          activeDeviceSessionSubject.next({ sessionId, transport });
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
              (error as { name?: string })?.name === "PeerRemovedPairing" ||
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
      const transport = new DeviceManagementKitBLETransport(getDeviceManagementKit(), sessionId);
      activeDeviceSessionSubject.next({ sessionId, transport });

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
            deviceModel: getDeviceModel(id),
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
          tracer.trace(
            "[DMKTransport] [listenToDisconnect] Device disconnected, closing transport",
          );

          if (activeDeviceSessionSubject.value?.sessionId === this.sessionId) {
            activeDeviceSessionSubject.next(null);
          }
          this.emit("disconnect");
        }
      },
      error: (error: unknown) => {
        tracer.trace("[DMKTransport] [listenToDisconnect] error", { error });
        this.emit("disconnect");
        if (subscription) {
          subscription.unsubscribe();
        }
      },
      complete: () => {
        tracer.trace("[DMKTransport] [listenToDisconnect] Complete");
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
    this.dmk.disconnect({ sessionId: this.sessionId }).catch(error => {
      tracer.trace("[DMKTransport] [disconnect] error", { error });
    });
  }

  async exchange(
    apdu: Buffer,
    { abortTimeoutMs }: { abortTimeoutMs?: number } = {},
  ): Promise<Buffer> {
    const activeSessionId = activeDeviceSessionSubject.value?.sessionId;
    if (!activeSessionId) {
      throw new Error("No active session found");
    }

    return await this.dmk
      .sendApdu({
        sessionId: activeSessionId,
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
}
