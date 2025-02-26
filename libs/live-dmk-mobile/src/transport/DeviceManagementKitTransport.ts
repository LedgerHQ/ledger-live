import Transport from "@ledgerhq/hw-transport";
import {
  DeviceManagementKit,
  type DeviceSessionState,
  DeviceStatus,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { activeDeviceSessionSubject, dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { LocalTracer } from "@ledgerhq/logs";
import { catchError, first, firstValueFrom, Observer, of, switchMap } from "rxjs";
import { deviceManagementKit } from "../hooks/useDeviceManagementKit";
import { DescriptorEvent } from "@ledgerhq/types-devices";

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

    tracer.trace("[open] activeSessionId: " + activeSessionId + " and deviceId: " + deviceOrId);
    console.log("[open] activeSessionId: " + activeSessionId + " and deviceId: " + deviceOrId);

    if (activeSessionId) {
      tracer.trace(`[open] checking existing session ${activeSessionId}`);

      const deviceSessionState: DeviceSessionState | null = await firstValueFrom(
        deviceManagementKit.getDeviceSessionState({ sessionId: activeSessionId }),
      ).catch(e => {
        tracer.trace("[SDKTransport][open] error getting device session state", e);
        return null;
      });

      if (
        deviceSessionState?.deviceStatus !== DeviceStatus.NOT_CONNECTED &&
        activeDeviceSessionSubject.value?.transport
      ) {
        tracer.trace("[open] reusing existing session and instantiating a new DmkTransport");
        return activeDeviceSessionSubject.value.transport;
      }
    }

    if (typeof deviceOrId === "string") {
      const devicesObs = deviceManagementKit.listenToAvailableDevices();
      tracer.trace("[open] listen to available devices");
      console.log("listen to available devices");

      const subscription = devicesObs.pipe(
        first(devices => devices.some(device => device.id === deviceOrId)),
        switchMap(async devices => {
          const found = devices.find(device => device.id === deviceOrId);
          if (!found) {
            tracer.trace("[open] device not found in available devices");
            return undefined;
          }
          console.log("FOUND DEVICE => CONNECT", found);

          tracer.trace(`[open] device found ${found.id}`);

          const sessionId = await deviceManagementKit.connect({ device: found });

          const transport = new DeviceManagementKitTransport(deviceManagementKit, sessionId);
          activeDeviceSessionSubject.next({ sessionId, transport });
          deviceManagementKit.stopDiscovering();

          return transport;
        }),
        catchError(error => {
          console.error("[open] error", error);
          deviceManagementKit.stopDiscovering();
          return of(undefined);
        }),
      );

      const transport = await firstValueFrom(subscription);

      if (transport) {
        return transport;
      }
    } else {
      const sessionId = await deviceManagementKit.connect({ device: deviceOrId });
      const transport = new DeviceManagementKitTransport(deviceManagementKit, sessionId);
      activeDeviceSessionSubject.next({ sessionId, transport });

      return transport;
    }

    // TODO: Handle this case
    tracer.trace("[open] no transport found");
    throw new Error("No transport found");
  }

  static listen(observer: Observer<DescriptorEvent<string>>) {
    const observable = deviceManagementKit.listenToAvailableDevices();
    let unsubscribed = false;

    const unsubscribe = () => {
      if (unsubscribed) return;
      unsubscribed = true;
      deviceManagementKit.stopDiscovering();
    };

    observable.subscribe({
      next: devices => {
        for (const device of devices) {
          const id = dmkToLedgerDeviceIdMap[device.deviceModel.model];
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
        console.log(devices);
      },
      complete: observer.complete,
      error: err => {
        unsubscribe();
        tracer.trace("[listen] error", err);
        observer.error(err);
      },
    });
    return {
      unsubscribe,
    };
  }

  listenToDisconnect = () => {
    const subscription = this.dmk.getDeviceSessionState({ sessionId: this.sessionId }).subscribe({
      next: (state: { deviceStatus: DeviceStatus }) => {
        if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
          this.tracer.trace("[listenToDisconnect] Device disconnected, closing transport");
          activeDeviceSessionSubject.next(null);
          this.emit("disconnect");
        }
      },
      error: (error: unknown) => {
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
    // this.dmk.close();
    this.dmk.stopDiscovering();
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
