import {
  DeviceManagementKit,
  DeviceStatus,
  type DeviceSessionState,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import Transport from "@ledgerhq/hw-transport";
import { dmkToLedgerDeviceIdMap, activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { LocalTracer } from "@ledgerhq/logs";
import { DescriptorEvent } from "@ledgerhq/types-devices";
import { firstValueFrom, Observer, startWith, pairwise, map } from "rxjs";
import { getDeviceManagementKit } from "../hooks/useDeviceManagementKit";

const tracer = new LocalTracer("live-dmk-tracer", { function: "DeviceManagementKitTransport" });

export class DeviceManagementKitTransport extends Transport {
  sessionId: string;
  readonly dmk: DeviceManagementKit;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    super();
    this.sessionId = sessionId;
    this.dmk = dmk;
    this.listenToDisconnect();
  }

  listenToDisconnect = () => {
    const subscription = this.dmk.getDeviceSessionState({ sessionId: this.sessionId }).subscribe({
      next: (state: { deviceStatus: DeviceStatus }) => {
        if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
          tracer.trace("[listenToDisconnect] Device disconnected, closing transport");
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
        tracer.trace("[listenToDisconnect] Complete");
        this.emit("disconnect");
        subscription.unsubscribe();
      },
    });
    return subscription;
  };

  static async open(): Promise<DeviceManagementKitTransport> {
    const activeSessionId = activeDeviceSessionSubject.value?.sessionId;

    if (activeSessionId) {
      tracer.trace(`[open] checking existing session ${activeSessionId}`);
      const deviceSessionState: DeviceSessionState | null = await firstValueFrom(
        getDeviceManagementKit().getDeviceSessionState({ sessionId: activeSessionId }),
      ).catch(e => {
        tracer.trace("[SDKTransport][open] error getting device session state", e);
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
      getDeviceManagementKit().listenToAvailableDevices({}),
    );
    const connectedSessionId = await getDeviceManagementKit().connect({
      device: discoveredDevice,
      sessionRefresherOptions: { isRefresherDisabled: true },
    });

    tracer.trace("[open] Connected");
    const transport = new DeviceManagementKitTransport(
      getDeviceManagementKit(),
      connectedSessionId,
    );
    activeDeviceSessionSubject.next({ sessionId: connectedSessionId, transport });

    return transport;
  }

  static listen = (observer: Observer<DescriptorEvent<string>>) => {
    const subscription = getDeviceManagementKit()
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
          console.log({ added, removed });
          for (const device of added) {
            const id = dmkToLedgerDeviceIdMap[device.deviceModel.model];

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
            const id = dmkToLedgerDeviceIdMap[device.deviceModel.model];

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

  disconnect = () => {
    this.dmk.disconnect({ sessionId: this.sessionId });
  };

  async exchange(apdu: Buffer): Promise<Buffer> {
    tracer.trace(`[exchange] => ${apdu.toString("hex")}`);

    const devices = this.dmk.listConnectedDevices();

    // If the device is not connected, connect to new session
    if (!devices.some(device => device.sessionId === this.sessionId)) {
      const [discoveredDevice] = await firstValueFrom(
        getDeviceManagementKit().listenToAvailableDevices({}),
      );
      const connectedSessionId = await getDeviceManagementKit().connect({
        device: discoveredDevice,
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
      this.sessionId = connectedSessionId;
    }

    return await this.dmk
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
        throw e;
      });
  }
}
