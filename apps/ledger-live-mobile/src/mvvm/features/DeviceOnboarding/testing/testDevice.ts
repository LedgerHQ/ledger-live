import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
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
  isWatching(sessionId: string): boolean;
};

/** A Bluetooth Stax that connects and reports its session state, but never answers a command. */
export function createTestDevice(): TestDevice {
  const foundDevices = createTestStream<DiscoveredDevice[]>({ current: [] });
  const sessions = new Map<string, SessionStream>();
  let sessionId = "session-1";
  let deviceId = "device-id";

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
    getDeviceSessionState: ({ sessionId: id }) => getSession(id).events,
    sendCommand: () => new Promise(() => undefined),
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
