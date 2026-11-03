import { useCallback } from "react";
import RNRestart from "react-native-restart";
import { getEnv } from "@shared/env";
import { mockserverIdentifier } from "@ledgerhq/live-dmk-mobile";
import {
  createMockServerSession,
  getMockServerDeviceIdFromCompatId,
  getMockServerSession,
  isMockServerCompatDeviceId,
  parseMockServerSessionImport,
} from "@ledgerhq/live-dmk-shared";
import { useStore } from "~/context/hooks";
import { saveKnownDevices, saveSettings } from "~/db";
import { setLastConnectedDevice, setMockServerSettings } from "~/actions/settings";
import {
  exportSelector as knownDevicesExportSelector,
  knownDevicesSelector,
  removeKnownDevices,
} from "~/reducers/knownDevices";
import { lastConnectedDeviceSelector, settingsStoreSelector } from "~/reducers/settings";

export type MockServerSessionActions = {
  startNewSession: (url: string) => Promise<void>;
  joinSession: (url: string, token: string) => Promise<void>;
  disable: () => Promise<void>;
};

/** Every action ends with an app restart: the DMK only picks up the mock server transport at build time. */
export function useMockServerSessionActions(): MockServerSessionActions {
  const store = useStore();

  const removeMockServerDevicesExcept = useCallback(
    (keptDeviceIds: ReadonlySet<string>) => {
      const state = store.getState();
      const removedDeviceIds = knownDevicesSelector(state)
        .filter(
          device => device.transport === mockserverIdentifier && !keptDeviceIds.has(device.id),
        )
        .map(device => device.id);
      store.dispatch(removeKnownDevices(removedDeviceIds));

      const lastConnectedDeviceId = lastConnectedDeviceSelector(state)?.deviceId ?? "";
      const isLastConnectedDeviceRemoved =
        isMockServerCompatDeviceId(lastConnectedDeviceId) &&
        !keptDeviceIds.has(getMockServerDeviceIdFromCompatId(lastConnectedDeviceId));
      if (isLastConnectedDeviceRemoved) store.dispatch(setLastConnectedDevice(null));
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
      removeMockServerDevicesExcept(new Set(session.devices.map(device => device.id)));
      store.dispatch(setMockServerSettings({ enabled: true, url, token }));
      await persistAndRestart();
    },
    [persistAndRestart, removeMockServerDevicesExcept, store],
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
    removeMockServerDevicesExcept(new Set());
    const { mockServer } = settingsStoreSelector(store.getState());
    store.dispatch(setMockServerSettings({ enabled: false, url: mockServer.url, token: "" }));
    await persistAndRestart();
  }, [persistAndRestart, removeMockServerDevicesExcept, store]);

  return { startNewSession, joinSession, disable };
}
