import {
  DeviceDisconnectedBeforeSendingApdu,
  DeviceDisconnectedWhileSendingError,
  DeviceManagementKit,
  DeviceStatus,
  SendApduEmptyResponseError,
} from "@ledgerhq/device-management-kit";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { DisconnectedDevice } from "@ledgerhq/errors";
import Transport from "@ledgerhq/hw-transport";
import { LocalTracer, TraceContext } from "@ledgerhq/logs";
import { Subscription, firstValueFrom } from "rxjs";
import { first, tap, timeout } from "rxjs/operators";
import { getDeviceManagementKit } from "../hooks/useDeviceManagementKit";

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
    const reusableSession = dmk
      .listConnectedDevices()
      .find(connectedDevice => connectedDevice.type === "USB");

    tracer.trace(`[open] called with deviceId: ${deviceId} and timeoutMs: ${timeoutMs}`);

    try {
      if (reusableSession) {
        tracer.trace("[open] reusing existing session", {
          sessionId: reusableSession.sessionId,
        });
        return new DeviceManagementKitHIDTransport(dmk, reusableSession.sessionId);
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
      return transport;
    } catch (err) {
      tracer.trace("[open] open error", { err });
      throw err;
    }
  }

  async exchange(apdu: Buffer, { abortTimeoutMs }: { abortTimeoutMs?: number } = {}) {
    const isSessionConnected = this.dmk
      .listConnectedDevices()
      .some(device => device.sessionId === this.sessionId);

    if (!isSessionConnected) {
      throw new DisconnectedDevice();
    }

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
