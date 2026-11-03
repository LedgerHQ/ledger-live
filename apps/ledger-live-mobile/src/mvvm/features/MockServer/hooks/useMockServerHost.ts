import { useMemo } from "react";
import RNRestart from "react-native-restart";
import { getEnv } from "@shared/env";
import type { MockServerHost } from "@features/flow-device-mock-server";
import { mockserverIdentifier } from "@ledgerhq/live-dmk-mobile";
import {
  getMockServerDeviceIdFromCompatId,
  isMockServerCompatDeviceId,
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

export function useMockServerHost(): MockServerHost {
  const store = useStore();

  return useMemo<MockServerHost>(
    () => ({
      getSessionDefaults: () => ({
        sessionImport: getEnv("MOCK_SERVER_SESSION"),
        seed: getEnv("MOCK_SERVER_SEED").trim() || undefined,
      }),
      saveSettings: settings => store.dispatch(setMockServerSettings(settings)),
      forgetDevicesExcept: keptDeviceIds => {
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
      persistAndRestart: async () => {
        const state = store.getState();
        await saveSettings(settingsStoreSelector(state));
        await saveKnownDevices(knownDevicesExportSelector(state));
        RNRestart.restart();
      },
    }),
    [store],
  );
}
