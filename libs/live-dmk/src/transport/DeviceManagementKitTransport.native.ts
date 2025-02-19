import Transport from "@ledgerhq/hw-transport";
import {
  DeviceManagementKit,
  type DeviceSessionState,
  DeviceStatus,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { activeDeviceSessionSubject } from "../config/activeDeviceSession";
import { LocalTracer } from "@ledgerhq/logs";
import { deviceManagementKit } from "../hooks/useDeviceManagementKit";
import { firstValueFrom } from "rxjs";

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

  static async open(device: DiscoveredDevice): Promise<DeviceManagementKitTransport> {
    const activeSessionId = activeDeviceSessionSubject.value?.sessionId;

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
    }
    const sessionId = await deviceManagementKit.connect({ device });

    console.log("sessionId", sessionId);
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

  exchange(
    _apdu: Buffer,
    { abortTimeoutMs: _abortTimeoutMs }: { abortTimeoutMs?: number } = {},
  ): Promise<Buffer> {
    return super.exchange(_apdu, { abortTimeoutMs: _abortTimeoutMs });
  }
}
