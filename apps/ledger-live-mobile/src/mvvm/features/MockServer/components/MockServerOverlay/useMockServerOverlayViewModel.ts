import { useCallback } from "react";
import Config from "react-native-config";
import { getEnv } from "@shared/env";
import type { MockServerOverlayProps } from "@features/flow-device-mock-server";
import {
  getMockServerDeviceModelId,
  type MockServerDevice,
} from "@features/platform-device-mock-server";
import { mockserverIdentifier } from "@ledgerhq/live-dmk-mobile";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { FLOATING_DEBUG_BUTTON_Z_INDEX } from "~/components/FloatingDebugButton";
import { useDispatch, useSelector } from "~/context/hooks";
import { NavigatorName, ScreenName } from "~/const";
import { addKnownDevice } from "~/reducers/knownDevices";
import { mockServerSettingsSelector, resolvedThemeSelector } from "~/reducers/settings";
import { navigationRef } from "~/rootnavigation";
import { useApplyMockServerSessionChange } from "../../hooks/useApplyMockServerSessionChange";

export function useMockServerOverlayViewModel(): MockServerOverlayProps | null {
  const dispatch = useDispatch();
  const settings = useSelector(mockServerSettingsSelector);
  const colorScheme = useSelector(resolvedThemeSelector);
  const onApply = useApplyMockServerSessionChange();

  const onOpenSettings = useCallback(() => {
    navigationRef.current?.navigate(NavigatorName.Settings, {
      screen: ScreenName.DebugMockServer,
    });
  }, []);

  const onSaveKnownDevices = useCallback(
    (devices: readonly MockServerDevice[]) => {
      for (const device of devices) {
        const dmkModelId = getMockServerDeviceModelId(device);
        if (!dmkModelId) continue;
        dispatch(
          addKnownDevice({
            transport: mockserverIdentifier,
            id: device.id,
            name: device.name,
            deviceModelId: dmkToLedgerDeviceIdMap[dmkModelId],
          }),
        );
      }
    },
    [dispatch],
  );

  if (Config.DETOX) return null;

  return {
    settings,
    sessionImport: getEnv("MOCK_SERVER_SESSION"),
    seed: getEnv("MOCK_SERVER_SEED").trim() || undefined,
    colorScheme,
    zIndex: FLOATING_DEBUG_BUTTON_Z_INDEX,
    onApply,
    onOpenSettings,
    onSaveKnownDevices,
  };
}
