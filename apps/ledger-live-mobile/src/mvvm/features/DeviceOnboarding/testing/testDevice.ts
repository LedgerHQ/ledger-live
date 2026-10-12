import type {
  DeviceManagementKit,
  DeviceSessionState,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { DeviceModelId, DeviceStatus } from "@ledgerhq/device-management-kit";
import {
  createDeviceManagementKit,
  createSessionStream,
  createTestStream,
  type SessionStream,
} from "@ledgerhq/device-onboarding/testing";
import { rnBleTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { DeviceModelId as LedgerDeviceModelId } from "@ledgerhq/types-devices";
import { startWith } from "rxjs";

const staxName = "Ledger Stax";

export const knownStax: KnownDevice = {
  id: "device-id",
  name: staxName,
  transport: rnBleTransportIdentifier,
  deviceModelId: LedgerDeviceModelId.stax,
};

export type TestDevice = {
  dmk: DeviceManagementKit;
  sessionId: string;
  setSession(sessionId: string): void;
  setDeviceId(deviceId: string): void;
  show(): void;
  unplug(): void;
  /** The current session reports a locked device, now and to anyone who watches it later. */
  lock(): void;
  isWatching(sessionId: string): boolean;
  /** The session of each command sent, in order. */
  readonly sentTo: readonly string[];
};

/** A Bluetooth Stax that connects and reports its session state, but never answers a command. */
export function createTestDevice(): TestDevice {
  const foundDevices = createTestStream<DiscoveredDevice[]>({ current: [] });
  const sessions = new Map<string, SessionStream>();
  let sessionId = "session-1";
  let deviceId = "device-id";
  const sentTo: string[] = [];
  const locked = new Set<string>();

  const dmk = createDeviceManagementKit({
    listConnectedDevices: () => [],
    listenToAvailableDevices: () => foundDevices.events,
    connect: () => Promise.resolve(sessionId),
    getConnectedDevice: ({ sessionId: id }) => ({
      id: deviceId,
      name: staxName,
      type: "BLE",
      sessionId: id,
      modelId: DeviceModelId.STAX,
      transport: rnBleTransportIdentifier,
    }),
    // Like the real kit, a watcher first hears the state the session is already in.
    getDeviceSessionState: ({ sessionId: id }) =>
      locked.has(id)
        ? getSession(id).events.pipe(
            startWith({ deviceStatus: DeviceStatus.LOCKED } as DeviceSessionState),
          )
        : getSession(id).events,
    sendCommand: ({ sessionId: id }) => {
      sentTo.push(id);
      return new Promise(() => undefined);
    },
  });

  return {
    dmk,
    get sessionId() {
      return sessionId;
    },
    setSession(nextId: string) {
      sessionId = nextId;
    },
    setDeviceId(nextId: string) {
      deviceId = nextId;
    },
    show() {
      foundDevices.push([
        {
          id: deviceId,
          name: staxName,
          transport: rnBleTransportIdentifier,
          deviceModel: { id: LedgerDeviceModelId.stax, model: DeviceModelId.STAX, name: staxName },
        } as DiscoveredDevice,
      ]);
    },
    unplug() {
      getSession(sessionId).set(DeviceStatus.NOT_CONNECTED);
    },
    lock() {
      locked.add(sessionId);
      getSession(sessionId).set(DeviceStatus.LOCKED);
    },
    sentTo,
    isWatching(id: string) {
      return sessions.get(id)?.watched === true;
    },
  };

  function getSession(id: string): SessionStream {
    const states = sessions.get(id) ?? createSessionStream();
    sessions.set(id, states);
    return states;
  }
}
