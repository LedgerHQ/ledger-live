import Transport from "@ledgerhq/hw-transport";
import {
  DeviceManagementKit,
  type DeviceSessionState,
  DeviceStatus,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { LocalTracer } from "@ledgerhq/logs";
import { firstValueFrom } from "rxjs";
import { deviceManagementKit } from "../hooks/useDeviceManagementKit";

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

  static async open(deviceOrId: DiscoveredDevice | string): Promise<DeviceManagementKitTransport> {
    const activeSessionId = activeDeviceSessionSubject.value?.sessionId;

    console.log("CALLING OPEN WITH SESSION ID: ", activeSessionId, " AND DEVICE: ", deviceOrId);
    if (activeSessionId) {
      tracer.trace(`[open] checking existing session ${activeSessionId}`);
      const deviceSessionState: DeviceSessionState | null = await firstValueFrom(
        deviceManagementKit.getDeviceSessionState({ sessionId: activeSessionId }),
      ).catch(e => {
        console.error("[SDKTransport][open] error getting device session state", e);
        return null;
      });

      if (
        deviceSessionState?.deviceStatus !== DeviceStatus.NOT_CONNECTED &&
        activeDeviceSessionSubject.value?.transport
      ) {
        tracer.trace("[open] reusing existing session and instantiating a new SdkTransport");
        return activeDeviceSessionSubject.value.transport;
      }
    } else if (typeof deviceOrId === "string") {
      const devicesObs = deviceManagementKit.listenToAvailableDevices();
      const subscription = devicesObs.subscribe({
        next: devices => {
          if (devices.some(device => device.id === deviceOrId)) {
            const [discoveredDevice] = devices.filter(device => device.id === deviceOrId);
            tracer.trace(`[open] device found ${discoveredDevice.id}`);
            subscription.unsubscribe();
            deviceManagementKit.stopDiscovering();
          }
        },
        complete: () => {
          deviceManagementKit.stopDiscovering();
        },
        error: () => {
          deviceManagementKit.stopDiscovering();
          subscription.unsubscribe();
        },
      });
    }

    // @ts-expect-error here device is not a string
    const sessionId = await deviceManagementKit.connect({ device: deviceOrId });

    const transport = new DeviceManagementKitTransport(deviceManagementKit, sessionId);
    activeDeviceSessionSubject.next({ sessionId, transport });

    return transport;
  }

  static listen() {
    const observable = deviceManagementKit.listenToAvailableDevices();
    return observable.subscribe({
      next: devices => {
        console.log(devices);
      },
    });
  }

  listenToDisconnect = () => {
    const subscription = this.dmk.getDeviceSessionState({ sessionId: this.sessionId }).subscribe({
      next: (state: { deviceStatus: any }) => {
        if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
          this.tracer.trace("[listenToDisconnect] Device disconnected, closing transport");
          activeDeviceSessionSubject.next(null);
          this.emit("disconnect");
        }
      },
      error: (error: any) => {
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
    this.dmk.close();
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
