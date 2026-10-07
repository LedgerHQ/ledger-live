import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { DeviceStatus } from "@ledgerhq/device-management-kit";
import { createDeviceManagementKit } from "../../../../../../../libs/device-onboarding/src/tests/createDeviceManagementKit";
import {
  createSessionStream,
  createTestStream,
  type SessionStream,
} from "../../../../../../../libs/device-onboarding/src/tests/testStream";
import {
  devices,
  knownStax,
  OsSlot,
  type OnboardingDevice,
  type OsSlot as OsSlotName,
} from "./deviceClass";

export { knownStax };

export type TestDevice = {
  dmk: DeviceManagementKit;
  model: OnboardingDevice;
  osVersion: string;
  cloud: string;
  latest: string;
  sessionId: string;
  setSession(sessionId: string): void;
  show(): void;
  unplug(sessionId?: string): void;
  failRead(): void;
  isWatching(sessionId: string): boolean;
};

export function createTestDevice(
  model: OnboardingDevice = devices.stax,
  os: OsSlotName = OsSlot.Latest,
): TestDevice {
  const osVersion = model.os(os);
  const foundDevices = createTestStream<DiscoveredDevice[]>({ current: [] });
  const sessions = new Map<string, SessionStream>();
  let sessionId = "session-1";
  let readFails = false;

  const dmk = createDeviceManagementKit({
    listConnectedDevices: () => [],
    listenToAvailableDevices: () => foundDevices.events,
    connect: async () => sessionId,
    getConnectedDevice: ({ sessionId: id }) => ({
      id: "device-id",
      name: model.name,
      type: model.wired ? "USB" : "BLE",
      sessionId: id,
      modelId: model.dmkModelId,
      transport: model.transport,
    }),
    getDeviceSessionState: ({ sessionId: id }) => getSession(id).events,
    sendCommand: () =>
      readFails ? Promise.reject(new Error("read failed")) : new Promise(() => undefined),
  });

  return {
    dmk,
    model,
    osVersion,
    cloud: model.cloud,
    latest: model.latest,
    get sessionId() {
      return sessionId;
    },
    setSession(nextId: string) {
      sessionId = nextId;
    },
    show() {
      foundDevices.push([foundDevice(model)]);
    },
    unplug(id = sessionId) {
      getSession(id).set(DeviceStatus.NOT_CONNECTED);
    },
    failRead() {
      readFails = true;
    },
    isWatching(id: string) {
      return sessions.get(id)?.watched === true;
    },
  };

  function foundDevice(device: OnboardingDevice): DiscoveredDevice {
    return {
      id: "device-id",
      name: device.name,
      transport: device.transport,
      deviceModel: {
        id: device.ledgerModelId,
        model: device.dmkModelId,
        name: device.name,
      },
    } as DiscoveredDevice;
  }

  function getSession(id: string): SessionStream {
    const states = sessions.get(id) ?? createSessionStream();
    sessions.set(id, states);
    return states;
  }
}
