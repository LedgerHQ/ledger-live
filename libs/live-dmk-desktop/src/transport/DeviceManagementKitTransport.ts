import {
  type DeviceId,
  DeviceManagementKit,
  DeviceStatus,
  type DeviceSessionState,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import Transport, { type DescriptorEvent } from "@ledgerhq/hw-transport";
import { dmkToLedgerDeviceIdMap, activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { LocalTracer } from "@ledgerhq/logs";
import {
  firstValueFrom,
  Observer,
  startWith,
  pairwise,
  map,
  Subscription,
  filter,
  timeout,
} from "rxjs";
import { getDeviceManagementKit } from "../hooks/useDeviceManagementKit";

const tracer = new LocalTracer("live-dmk-tracer", { function: "DeviceManagementKitTransport" });

const AVAILABLE_DEVICE_TIMEOUT_MS = 10000;

/**
 * Resolves with the first device `select` picks among the available ones.
 * Discovery emits an empty array first (before transports report), so this waits for an emission
 * where `select` finds a device instead of grabbing the initial []. Real devices are already
 * discovered when this runs; it lets the mock transport's first poll populate the list.
 */
const waitForAvailableDevice = (
  dmk: DeviceManagementKit,
  select: (devices: DiscoveredDevice[]) => DiscoveredDevice | undefined,
): Promise<DiscoveredDevice> =>
  firstValueFrom(
    dmk.listenToAvailableDevices({}).pipe(
      map(select),
      filter((device): device is DiscoveredDevice => device !== undefined),
      timeout({ first: AVAILABLE_DEVICE_TIMEOUT_MS }),
    ),
  );

/**
 * Session of `device`: the DMK one when the device is already connected (web-ble rejects a second
 * connect to a connected device), a new one otherwise.
 */
const getOrConnectSession = async (
  dmk: DeviceManagementKit,
  device: DiscoveredDevice,
): Promise<string> => {
  const connectedDevice = dmk.listConnectedDevices().find(connected => connected.id === device.id);
  if (connectedDevice) {
    tracer.trace(`reusing the connected session of device ${device.id}`);
    return connectedDevice.sessionId;
  }
  return dmk.connect({ device, sessionRefresherOptions: { isRefresherDisabled: true } });
};

type PendingOpen = {
  deviceId: DeviceId | undefined;
  promise: Promise<DeviceManagementKitTransport>;
};

export class DeviceManagementKitTransport extends Transport {
  sessionId: string;
  readonly dmk: DeviceManagementKit;
  /** Device this transport was opened for; reconnections only target it. */
  readonly deviceId: DeviceId;

  private static pendingOpen: PendingOpen | null = null;

  constructor(dmk: DeviceManagementKit, sessionId: string, deviceId: DeviceId) {
    super();
    this.sessionId = sessionId;
    this.dmk = dmk;
    this.deviceId = deviceId;
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

  /**
   * Opens a transport to `deviceId`, or to the first available device when no id is given or the
   * device is not available.
   * Single-flight: concurrent opens of the same target share the in-flight one, an open of another
   * target waits for it, so a device is never connected twice in parallel.
   */
  static async open(deviceId?: DeviceId): Promise<DeviceManagementKitTransport> {
    const targetId = deviceId || undefined;
    let pending = DeviceManagementKitTransport.pendingOpen;
    while (pending && pending.deviceId !== targetId) {
      await Promise.allSettled([pending.promise]);
      pending = DeviceManagementKitTransport.pendingOpen;
    }
    if (pending) return pending.promise;

    const promise = DeviceManagementKitTransport.openSession(targetId).finally(() => {
      DeviceManagementKitTransport.pendingOpen = null;
    });
    DeviceManagementKitTransport.pendingOpen = { deviceId: targetId, promise };
    return promise;
  }

  private static async openSession(
    deviceId: DeviceId | undefined,
  ): Promise<DeviceManagementKitTransport> {
    const dmk = getDeviceManagementKit();
    const activeSession = activeDeviceSessionSubject.value;

    if (activeSession) {
      tracer.trace(`[open] checking existing session ${activeSession.sessionId}`);
      const deviceSessionState: DeviceSessionState | null = await firstValueFrom(
        dmk.getDeviceSessionState({ sessionId: activeSession.sessionId }),
      ).catch(e => {
        tracer.trace("[SDKTransport][open] error getting device session state", e);
        return null;
      });

      if (
        deviceSessionState?.deviceStatus !== DeviceStatus.NOT_CONNECTED &&
        activeSession.transport instanceof DeviceManagementKitTransport &&
        (!deviceId || activeSession.transport.deviceId === deviceId)
      ) {
        tracer.trace("[open] reusing existing session");
        return activeSession.transport;
      }
    }

    tracer.trace("[open] No reusable session found, starting discovery");
    const device = await waitForAvailableDevice(
      dmk,
      devices => devices.find(available => available.id === deviceId) ?? devices[0],
    );
    const sessionId = await getOrConnectSession(dmk, device);

    tracer.trace("[open] Connected");
    const transport = new DeviceManagementKitTransport(dmk, sessionId, device.id);
    activeDeviceSessionSubject.next({ sessionId, transport });

    return transport;
  }

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
        descriptor: device.id,
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
        descriptor: device.id,
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

    // The session is gone: reconnect the device this transport was opened for, never another one.
    if (!devices.some(device => device.sessionId === this.sessionId)) {
      const discoveredDevice = await waitForAvailableDevice(this.dmk, available =>
        available.find(device => device.id === this.deviceId),
      );
      this.sessionId = await getOrConnectSession(this.dmk, discoveredDevice);
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
