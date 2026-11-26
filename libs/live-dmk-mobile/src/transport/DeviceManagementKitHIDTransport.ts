import {
  DeviceDisconnectedBeforeSendingApdu,
  DeviceDisconnectedWhileSendingError,
  DeviceManagementKit,
  DeviceStatus,
  SendApduEmptyResponseError,
} from "@ledgerhq/device-management-kit";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { DisconnectedDevice } from "@ledgerhq/hw-transport/errors";
import Transport from "@ledgerhq/hw-transport";
import { disconnectOtherSessions } from "@ledgerhq/live-dmk-shared";
import { LocalTracer, TraceContext } from "@ledgerhq/logs";
import { BehaviorSubject, Subscription, firstValueFrom } from "rxjs";
import { first, tap, timeout } from "rxjs/operators";
import { getDeviceManagementKit } from "../hooks/useDeviceManagementKit";
import { buildUsbCompatDeviceId } from "./usbCompatDeviceId";

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

  /**
   * A DMK flow can open a session without publishing it in `activeDeviceSessionSubject`.
   * `exchange` reads that subject, so a reused session that is not published yet is published
   * there. Like the connection below, it falls back to the first USB device: a phone has one USB
   * port.
   */
  private static reuseConnectedSession(
    deviceId: string,
    dmk: DeviceManagementKit,
  ): DeviceManagementKitHIDTransport | null {
    const connectedUsbDevices = dmk
      .listConnectedDevices()
      .filter(device => device.transport === rnHidTransportIdentifier);
    const matchingDevice =
      connectedUsbDevices.find(device => buildUsbCompatDeviceId(device.id) === deviceId) ??
      connectedUsbDevices[0];

    if (!matchingDevice) {
      tracer.trace("[open] no connected device to reuse", { deviceId });
      return null;
    }

    const { sessionId } = matchingDevice;
    tracer.trace("[open] reusing the session of a connected device", {
      deviceId,
      connectedDeviceId: matchingDevice.id,
      sessionId,
    });
    const activeTransport = activeDeviceSessionSubject.value?.transport;
    if (activeTransport?.sessionId === sessionId) {
      return activeTransport;
    }
    const transport = new DeviceManagementKitHIDTransport(dmk, sessionId);
    activeDeviceSessionSubject.next({ transport });
    return transport;
  }

  static async open(
    deviceId: string,
    timeoutMs?: number,
    _context?: TraceContext,
    dmk: DeviceManagementKit = getDeviceManagementKit(),
  ) {
    tracer.trace(`[open] called with deviceId: ${deviceId} and timeoutMs: ${timeoutMs}`);

    try {
      const connectedTransport = DeviceManagementKitHIDTransport.reuseConnectedSession(
        deviceId,
        dmk,
      );
      if (connectedTransport) {
        return connectedTransport;
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
      disconnectOtherSessions(dmk, device[0]);
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
