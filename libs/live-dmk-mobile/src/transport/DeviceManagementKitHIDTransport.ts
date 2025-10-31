import {
  DeviceDisconnectedWhileSendingError,
  DeviceDisconnectedBeforeSendingApdu,
  DeviceManagementKit,
  DeviceStatus,
  DiscoveredDevice,
  SendApduEmptyResponseError,
} from "@ledgerhq/device-management-kit";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { getDeviceModel } from "@ledgerhq/devices";
import { DisconnectedDevice, HwTransportError } from "@ledgerhq/errors";
import Transport, { type Observer as TransportObserver } from "@ledgerhq/hw-transport";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { LocalTracer, TraceContext } from "@ledgerhq/logs";
import { DescriptorEvent } from "@ledgerhq/types-devices";
import { BehaviorSubject, Subscription, firstValueFrom, pairwise, startWith } from "rxjs";
import { first, tap, timeout } from "rxjs/operators";
import { getDeviceManagementKit } from "../hooks/useDeviceManagementKit";

export const activeDeviceSessionSubject = new BehaviorSubject<{
  transport: DeviceManagementKitHIDTransport;
} | null>(null);

activeDeviceSessionSubject.subscribe();

export const tracer = new LocalTracer("live-dmk", { function: "DeviceManagementKitHIDTransport" });

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

  static async open(
    deviceId: string,
    timeoutMs?: number,
    _context?: TraceContext,
    dmk: DeviceManagementKit = getDeviceManagementKit(),
  ) {
    const activeDeviceSession = activeDeviceSessionSubject.value;

    tracer.trace(`[open] called with deviceId: ${deviceId} and timeoutMs: ${timeoutMs}`);

    try {
      if (activeDeviceSession) {
        tracer.trace("[open] checking existing session", {
          sessionId: activeDeviceSession.transport.sessionId,
        });
        const deviceSessionState = await firstValueFrom(
          dmk.getDeviceSessionState({
            sessionId: activeDeviceSession.transport.sessionId,
          }),
        );

        const connectedDevice = dmk.getConnectedDevice({
          sessionId: activeDeviceSession.transport.sessionId,
        });
        if (
          connectedDevice.type === "USB" &&
          deviceSessionState.deviceStatus !== DeviceStatus.NOT_CONNECTED
        ) {
          tracer.trace("[open] reusing existing session", {
            sessionId: activeDeviceSession.transport.sessionId,
          });
          return activeDeviceSession.transport;
        }
        tracer.trace("[open] session not reusable");
      }
      tracer.trace(
        `[open] listening to available devices and connecting to first available device with timeoutMs: ${timeoutMs}`,
      );
      const device = await firstValueFrom(
        dmk.listenToAvailableDevices({ transport: rnHidTransportIdentifier }).pipe(
          first(devices => devices.length > 0),
          timeoutMs ? timeout(timeoutMs) : tap(),
        ),
      );
      tracer.trace("[open] device found", { device: device[0] });
      const sessionId = await dmk.connect({
        device: device[0],
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
      tracer.trace("[DMKTransportHID] [open] new device connected", {
        sessionId,
      });
      const transport = new DeviceManagementKitHIDTransport(dmk, sessionId);
      activeDeviceSessionSubject.next({
        transport,
      });
      return transport;
    } catch (err) {
      tracer.trace("[open] open error", { err });
      throw err;
    }
  }

  static listen(
    observer: TransportObserver<DescriptorEvent<string>, HwTransportError>,
    _context?: TraceContext,
    dmk: DeviceManagementKit = getDeviceManagementKit(),
  ) {
    let availableSubscription: Subscription | undefined = undefined;

    availableSubscription = dmk
      .listenToAvailableDevices({
        transport: rnHidTransportIdentifier,
      })
      .pipe(startWith<DiscoveredDevice[]>([]), pairwise())
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
            const deviceModelId = dmkToLedgerDeviceIdMap[device.deviceModel.model];
            const deviceModel = getDeviceModel(deviceModelId);
            observer.next({
              type: "add",
              descriptor: device.id,
              device: device,
              deviceModel,
            });
          }
        },
        complete: observer.complete,
        error: err => {
          tracer.trace("[listen] error", err);
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
    };

    return {
      unsubscribe,
    };
  }

  async exchange(apdu: Buffer, { abortTimeoutMs }: { abortTimeoutMs?: number } = {}) {
    const activeSessionId = activeDeviceSessionSubject.value?.transport.sessionId;
    if (!activeSessionId) {
      throw new DisconnectedDevice();
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
        tracer.trace("[DMKTransportHID] [exchange] error", { error });
        if (
          error instanceof SendApduEmptyResponseError ||
          error instanceof DeviceDisconnectedWhileSendingError ||
          error instanceof DeviceDisconnectedBeforeSendingApdu
        )
          throw new DisconnectedDevice();
        throw error;
      });
  }

  close() {
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
}
