import {
  DeviceManagementKit,
  DeviceStatus,
  type DeviceSessionState,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import Transport from "@ledgerhq/hw-transport";
import { DescriptorEvent } from "@ledgerhq/types-devices";
import { firstValueFrom, Observer, startWith, pairwise, map } from "rxjs";
import { LocalTracer } from "@ledgerhq/logs";
import { deviceIdMap } from "../config/deviceIdMap";
import { activeDeviceSessionSubject } from "../config/activeDeviceSession";
import { deviceManagementKit } from "../hooks/useDeviceManagementKit";

const tracer = new LocalTracer("live-dmk-tracer", { function: "DeviceManagementKitTransport" });

export class DeviceManagementKitTransport extends Transport {
  sessionId: string;
  readonly sdk: DeviceManagementKit;

  constructor(sdk: DeviceManagementKit, sessionId: string) {
    super();
    this.sessionId = sessionId;
    this.sdk = sdk;
    this.listenToDisconnect();
  }

  listenToDisconnect = () => {
    const subscription = this.sdk.getDeviceSessionState({ sessionId: this.sessionId }).subscribe({
      next: (state: { deviceStatus: any }) => {
        if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
          tracer.trace("[listenToDisconnect] Device disconnected, closing transport");
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
        tracer.trace("[listenToDisconnect] Complete");
        this.emit("disconnect");
        subscription.unsubscribe();
      },
    });
  };

  static async open(): Promise<DeviceManagementKitTransport> {
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

    tracer.trace("[open] No active session found, starting discovery");
    const [discoveredDevice] = await firstValueFrom(
      deviceManagementKit.listenToAvailableDevices({}),
    );
    const connectedSessionId = await deviceManagementKit.connect({ device: discoveredDevice });

    tracer.trace("[open] Connected");
    const transport = new DeviceManagementKitTransport(deviceManagementKit, connectedSessionId);
    activeDeviceSessionSubject.next({ sessionId: connectedSessionId, transport });

    return transport;
  }

  static listen = (observer: Observer<DescriptorEvent<string>>) => {
    const subscription = deviceManagementKit
      .listenToAvailableDevices({})
      .pipe(
        startWith<DiscoveredDevice[]>([]),
        pairwise(),
        map(([prev, curr]) => {
          const added = curr.filter(item => !prev.some(prevItem => prevItem.id === item.id));
          const removed = prev.filter(item => !curr.some(currItem => currItem.id === item.id));
          return { added, removed };
        }),
      )
      .subscribe({
        next: ({ added, removed }) => {
          for (const device of added) {
            const id = deviceIdMap[device.deviceModel.model];

            tracer.trace(`[listen] device added ${id}`);
            observer.next({
              type: "add",
              descriptor: "",
              device: device,
              // @ts-expect-error types are not matching
              deviceModel: {
                id,
              },
            });
          }

          for (const device of removed) {
            const id = deviceIdMap[device.deviceModel.model];

            tracer.trace(`[listen] device removed ${id}`);
            observer.next({
              type: "remove",
              descriptor: "",
              device: device,
              // @ts-expect-error types are not matching
              deviceModel: {
                id,
              },
            });
          }
        },
        error: observer.error,
        complete: observer.complete,
      });

    return {
      unsubscribe: () => subscription.unsubscribe(),
    };
  };

  close: () => Promise<void> = () => Promise.resolve();

  async exchange(apdu: Buffer): Promise<Buffer> {
    tracer.trace(`[exchange] => ${apdu.toString("hex")}`);

    const devices = await this.sdk.listConnectedDevices();

    // If the device is not connected, connect to new session
    if (!devices.some(device => device.sessionId === this.sessionId)) {
      const [discoveredDevice] = await firstValueFrom(
        deviceManagementKit.listenToAvailableDevices({}),
      );
      const connectedSessionId = await deviceManagementKit.connect({ device: discoveredDevice });
      this.sessionId = connectedSessionId;
    }

    return await this.sdk
      .sendApdu({
        sessionId: this.sessionId,
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
