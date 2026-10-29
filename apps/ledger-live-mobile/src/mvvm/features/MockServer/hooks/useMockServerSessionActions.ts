import { useCallback } from "react";
import RNRestart from "react-native-restart";
import { getEnv } from "@shared/env";
import {
  createMockServerSession,
  getMockServerSession,
  mockserverIdentifier,
  parseMockServerSessionImport,
  type MockServerDevice,
} from "@ledgerhq/live-dmk-mobile";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import type { DeviceModelId as DmkDeviceModelId } from "@ledgerhq/device-management-kit";
import { useStore } from "~/context/hooks";
import { saveKnownDevices, saveSettings } from "~/db";
import { setMockServerSettings } from "~/actions/settings";
import {
  addKnownDevice,
  exportSelector as knownDevicesExportSelector,
  knownDevicesSelector,
  removeKnownDevices,
} from "~/reducers/knownDevices";
import { settingsStoreSelector } from "~/reducers/settings";

export type MockServerSessionActions = {
  startNewSession: (url: string) => Promise<void>;
  joinSession: (url: string, token: string) => Promise<void>;
  disable: () => Promise<void>;
};

/** Every action ends with an app restart: the DMK only picks up the mock server transport at build time. */
export function useMockServerSessionActions(): MockServerSessionActions {
  const store = useStore();

  const replaceMockServerKnownDevices = useCallback(
    (devices: MockServerDevice[]) => {
      const mockServerKnownDeviceIds = knownDevicesSelector(store.getState())
        .filter(device => device.transport === mockserverIdentifier)
        .map(device => device.id);
      store.dispatch(removeKnownDevices(mockServerKnownDeviceIds));

      for (const device of devices) {
        const deviceModelId = dmkToLedgerDeviceIdMap[device.device_type as DmkDeviceModelId];
        if (!deviceModelId) continue;
        store.dispatch(
          addKnownDevice({
            transport: mockserverIdentifier,
            id: device.id,
            name: device.name,
            deviceModelId,
          }),
        );
      }
    },
    [store],
  );

  const persistAndRestart = useCallback(async () => {
    const state = store.getState();
    await saveSettings(settingsStoreSelector(state));
    await saveKnownDevices(knownDevicesExportSelector(state));
    RNRestart.restart();
  }, [store]);

  const joinSession = useCallback(
    async (url: string, token: string) => {
      const session = await getMockServerSession({ url, token });
      replaceMockServerKnownDevices(session.devices);
      store.dispatch(setMockServerSettings({ enabled: true, url, token }));
      await persistAndRestart();
    },
    [persistAndRestart, replaceMockServerKnownDevices, store],
  );

  const startNewSession = useCallback(
    async (url: string) => {
      const seed = getEnv("MOCK_SERVER_SEED").trim();
      const token = await createMockServerSession({
        url,
        sessionImport: parseMockServerSessionImport(getEnv("MOCK_SERVER_SESSION")),
        seed: seed || undefined,
      });
      await joinSession(url, token);
    },
    [joinSession],
  );

  const disable = useCallback(async () => {
    replaceMockServerKnownDevices([]);
    const { mockServer } = settingsStoreSelector(store.getState());
    store.dispatch(setMockServerSettings({ enabled: false, url: mockServer.url, token: "" }));
    await persistAndRestart();
  }, [persistAndRestart, replaceMockServerKnownDevices, store]);

  return { startNewSession, joinSession, disable };
}
