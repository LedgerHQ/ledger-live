import { useCallback } from "react";
import RNRestart from "react-native-restart";
import type { MockServerSessionChange } from "@features/flow-device-mock-server";
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

/** Ends with an app restart: the DMK only picks up the mock server transport at build time. */
export function useApplyMockServerSessionChange(): (
  change: MockServerSessionChange,
) => Promise<void> {
  const store = useStore();

  return useCallback(
    async ({ settings, sessionDeviceIds }: MockServerSessionChange) => {
      const state = store.getState();
      const removedDeviceIds = knownDevicesSelector(state)
        .filter(
          device => device.transport === mockserverIdentifier && !sessionDeviceIds.has(device.id),
        )
        .map(device => device.id);
      store.dispatch(removeKnownDevices(removedDeviceIds));

      const lastConnectedDeviceId = lastConnectedDeviceSelector(state)?.deviceId ?? "";
      const isLastConnectedDeviceRemoved =
        isMockServerCompatDeviceId(lastConnectedDeviceId) &&
        !sessionDeviceIds.has(getMockServerDeviceIdFromCompatId(lastConnectedDeviceId));
      if (isLastConnectedDeviceRemoved) store.dispatch(setLastConnectedDevice(null));

      store.dispatch(setMockServerSettings(settings));

      const nextState = store.getState();
      await saveSettings(settingsStoreSelector(nextState));
      await saveKnownDevices(knownDevicesExportSelector(nextState));
      // Deferred: reloading while the settings change still renders crashes the app on iOS
      setTimeout(() => RNRestart.restart(), 0);
    },
    [store],
  );
}
