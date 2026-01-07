import {
  type DeviceId,
  DeviceManagementKit,
  DeviceStatus,
  type DeviceSessionState,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import Transport from "@ledgerhq/hw-transport";
import { dmkToLedgerDeviceIdMap, activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { LocalTracer } from "@ledgerhq/logs";
import { DescriptorEvent } from "@ledgerhq/types-devices";
import { firstValueFrom, Observer, startWith, pairwise, map, Subscription } from "rxjs";
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

  // TODO remove after full ConnectApp migraton: useFeature("ldmkConnectApp")
  static listenLegacyConnectApp = (observer: Observer<DescriptorEvent<string>>) => {
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

  // Compose availableDevices and connectedDevices to avoid unwanted disconnection events
  static listen = (observer: Observer<DescriptorEvent<string>>) => {
    const dmk = getDeviceManagementKit();
    const connectedDevices = new Set<DeviceId>();
    const pendingRemovals = new Map<DeviceId, DiscoveredDevice>();
    const sessionSubscriptions = new Map<DeviceId, Subscription>();

    const notifyDeviceAdded = (device: DiscoveredDevice) => {
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
    };

    const notifyDeviceRemoved = (device: DiscoveredDevice) => {
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
    };

    const connectedSubscription = dmk.listenToConnectedDevice().subscribe({
      next: device => {
        connectedDevices.add(device.id);
        // Subscribe to session state to detect disconnection
        const sessionSubscription = dmk
          .getDeviceSessionState({ sessionId: device.sessionId })
          .subscribe({
            next: state => {
              if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
                connectedDevices.delete(device.id);
                if (sessionSubscriptions.has(device.id)) {
                  sessionSubscriptions.get(device.id)!.unsubscribe();
                  sessionSubscriptions.delete(device.id);
                }
                if (pendingRemovals.has(device.id)) {
                  notifyDeviceRemoved(pendingRemovals.get(device.id)!);
                  pendingRemovals.delete(device.id);
                }
              }
            },
            complete: () => {
              connectedDevices.delete(device.id);
              sessionSubscriptions.delete(device.id);
            },
            error: () => {
              connectedDevices.delete(device.id);
              sessionSubscriptions.delete(device.id);
            },
          });
        sessionSubscriptions.set(device.id, sessionSubscription);
      },
      error: observer.error,
      complete: observer.complete,
    });

    const availableSubscription = dmk
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
            pendingRemovals.delete(device.id);
            notifyDeviceAdded(device);
          }

          for (const device of removed) {
            if (!connectedDevices.has(device.id)) {
              notifyDeviceRemoved(device);
            } else {
              pendingRemovals.set(device.id, device);
            }
          }
        },
        error: observer.error,
        complete: observer.complete,
      });

    return {
      unsubscribe: () => {
        availableSubscription.unsubscribe();
        connectedSubscription.unsubscribe();
        sessionSubscriptions.forEach(sub => sub.unsubscribe());
        sessionSubscriptions.clear();
      },
    };
  };

  close: () => Promise<void> = () => Promise.resolve();

  disconnect = () => {
    this.dmk.disconnect({ sessionId: this.sessionId });
  };

  async exchange(apdu: Buffer): Promise<Buffer> {
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
        return response;
      })
      .catch(e => {
        throw e;
      });
  }
}
