import {
  DeviceManagementKit,
  DeviceStatus,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import Transport, { type Observer as TransportObserver } from "@ledgerhq/hw-transport";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { DescriptorEvent, DeviceModel } from "@ledgerhq/types-devices";
import { HwTransportError } from "@ledgerhq/errors";
import { getDeviceManagementKit } from "../hooks/useDeviceManagementKit";
import { BehaviorSubject, firstValueFrom, pairwise, startWith, Subscription } from "rxjs";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { LocalTracer } from "@ledgerhq/logs";

type DMKTransport = Transport & {
  sessionId: string;
  dmk: DeviceManagementKit;
  listenToDisconnect: () => Subscription;
  disconnect: (id?: string) => Promise<void> | void;
};

export const activeDeviceSessionSubject = new BehaviorSubject<{
  sessionId: string;
  transport: DMKTransport;
} | null>(null);

const tracer = new LocalTracer("live-dmk", { function: "DeviceManagementKitHIDTransport" });

export class DeviceManagementKitHIDTransport extends Transport {
  sessionId: string;
  dmk: DeviceManagementKit;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    super();
    this.sessionId = sessionId;
    this.dmk = dmk;
    this.tracer = tracer;
    this.listenToDisconnect();
  }

  static async open(deviceId: string) {
    const activeDeviceSession = activeDeviceSessionSubject.value;
    const dmk = getDeviceManagementKit();

    if (!activeDeviceSession) {
      const sessionId = await dmk.connect({
        device: { id: deviceId, transport: rnHidTransportIdentifier } as DiscoveredDevice,
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
      const transport = new DeviceManagementKitHIDTransport(dmk, sessionId);
      activeDeviceSessionSubject.next({
        sessionId,
        transport,
      });
      return transport;
    }

    let transport: DeviceManagementKitHIDTransport | undefined = undefined;

    try {
      const deviceSessionState = await firstValueFrom(
        activeDeviceSession.transport.dmk.getDeviceSessionState({
          sessionId: activeDeviceSession.sessionId,
        }),
      );

      const connectedDevice = dmk.getConnectedDevice({
        sessionId: activeDeviceSession.sessionId,
      });
      if (
        [`usb_${deviceId}`, deviceId].includes(connectedDevice.id) &&
        connectedDevice.type === "USB" &&
        deviceSessionState.deviceStatus !== DeviceStatus.NOT_CONNECTED
      ) {
        transport = activeDeviceSession.transport;
      } else {
        const sessionId = await activeDeviceSession.transport.dmk.connect({
          device: { id: deviceId, transport: rnHidTransportIdentifier } as DiscoveredDevice,
          sessionRefresherOptions: { isRefresherDisabled: true },
        });
        transport = new DeviceManagementKitHIDTransport(dmk, sessionId);
        activeDeviceSessionSubject.next({ transport, sessionId });
      }
    } catch (err) {
      tracer.trace("[DMKTransportHID] open error", { err });
      throw err;
    }

    return transport;
  }

  static listen(observer: TransportObserver<DescriptorEvent<string>, HwTransportError>) {
    const dmk = getDeviceManagementKit();
    const observable = dmk.listenToAvailableDevices({
      transport: rnHidTransportIdentifier,
    });

    let availableSubscription: Subscription | undefined = undefined;
    let connectedSubscription: Subscription | undefined = undefined;
    let sessionStateSubscription: Subscription | undefined = undefined;

    connectedSubscription = dmk.listenToConnectedDevice().subscribe({
      next: connectedDevice => {
        if (connectedDevice.type !== "USB") {
          return;
        }
        if (sessionStateSubscription) {
          sessionStateSubscription.unsubscribe();
        }
        try {
          const sessionStateObs = dmk.getDeviceSessionState({
            sessionId: connectedDevice.sessionId,
          });
          sessionStateSubscription = sessionStateObs.subscribe({
            next: sessionState => {
              const id = dmkToLedgerDeviceIdMap[connectedDevice.modelId];
              if (sessionState.deviceStatus === DeviceStatus.NOT_CONNECTED) {
                observer.next({
                  type: "remove",
                  descriptor: connectedDevice.id,
                  device: connectedDevice,
                });
              } else {
                observer.next({
                  type: "add",
                  descriptor: connectedDevice.id,
                  device: connectedDevice,
                  deviceModel: {
                    productName: connectedDevice.name,
                    id,
                  } as DeviceModel,
                });
              }
            },
            error: err => {
              tracer.trace("[DMKTransportHID] [listen] listen error", err);
            },
          });
        } catch (err) {
          tracer.trace("[DMKTransportHID] [listen] listen getDeviceSessionState error", { err });
          observer.error(err as HwTransportError);
        }
      },
    });

    availableSubscription = observable
      .pipe(startWith([] as DiscoveredDevice[]), pairwise())
      .subscribe({
        next: ([prevDevices, currDevices]) => {
          const removedDevice = prevDevices.find(
            prevDevice => !currDevices.some(device => device.id === prevDevice.id),
          );
          if (removedDevice) {
            observer.next({
              type: "remove",
              descriptor: removedDevice.id,
              device: removedDevice,
            });
          }
          for (const device of currDevices) {
            const id = dmkToLedgerDeviceIdMap[device.deviceModel.model];
            observer.next({
              type: "add",
              descriptor: device.id,
              device: device,
              deviceModel: {
                productName: device.name,
                id,
              } as DeviceModel,
            });
          }
        },
        complete: observer.complete,
        error: err => {
          tracer.trace("[DMKTransportHID] [listen] error", err);
          observer.error(err);
          if (availableSubscription) {
            availableSubscription.unsubscribe();
          }
        },
      });

    const unsubscribe = () => {
      if (availableSubscription && !availableSubscription.closed) {
        availableSubscription.unsubscribe();
      }
      if (connectedSubscription && !connectedSubscription.closed) {
        connectedSubscription.unsubscribe();
      }
      if (sessionStateSubscription && !sessionStateSubscription.closed) {
        sessionStateSubscription.unsubscribe();
      }
    };

    return {
      unsubscribe,
    };
  }

  async exchange(apdu: Buffer, { abortTimeoutMs }: { abortTimeoutMs?: number } = {}) {
    const activeSessionId = activeDeviceSessionSubject.value?.sessionId;
    if (!activeSessionId) {
      throw new Error("No active session found");
    }

    tracer.trace(`[exchange] => ${apdu.toString("hex")}`);

    return await this.dmk
      .sendApdu({
        sessionId: activeSessionId,
        apdu: new Uint8Array(apdu),
        abortTimeout: abortTimeoutMs,
      })
      .then((apduResponse: { data: Uint8Array; statusCode: Uint8Array }): Buffer => {
        const response = Buffer.from([...apduResponse.data, ...apduResponse.statusCode]);
        tracer.trace(`[exchange] <= ${response.toString("hex")}`);
        return response;
      })
      .catch(error => {
        tracer.trace("[DMKTransportHID] [exchange] error", { error });
        throw error;
      });
  }

  close() {
    tracer.trace("[DMKTransportHID] [close] closing transport");
    this.dmk.stopDiscovering();
    return Promise.resolve();
  }

  listenToDisconnect() {
    let subscription: Subscription | undefined = undefined;

    subscription = this.dmk.getDeviceSessionState({ sessionId: this.sessionId }).subscribe({
      next: (state: { deviceStatus: DeviceStatus }) => {
        if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
          this.tracer.trace(
            "[DMKTransport] [listenToDisconnect] Device disconnected, closing transport",
          );
          activeDeviceSessionSubject.next(null);
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
  }

  disconnect() {
    this.dmk.disconnect({ sessionId: this.sessionId }).catch(error => {
      this.tracer.trace("[DMKTransport] [disconnect] error", { error });
    });
  }
}
