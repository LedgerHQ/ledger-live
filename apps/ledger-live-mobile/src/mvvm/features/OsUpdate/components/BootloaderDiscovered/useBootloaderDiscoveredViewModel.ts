import { useCallback, useEffect, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { track, trackPage } from "@shared/analytics";
import { rnHidTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import type { Device } from "@ledgerhq/live-dmk-shared";
import { OsUpdateFlowMode } from "@ledgerhq/live-common/os-update/types";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { getSharedAnalytics } from "../../analytics/getSharedAnalytics";
import { OsUpdateButton, OsUpdatePage } from "../../analytics/types";

export function useBootloaderDiscoveredViewModel(device: Device) {
  const navigation = useNavigation<BaseNavigation>();
  // Not `device` itself: callers rebuild it on every render, which would resend the page.
  const { deviceModelId, transport } = device;
  const sharedAnalytics = useMemo(
    () =>
      getSharedAnalytics({
        modelId: deviceModelId,
        wired: transport === rnHidTransportIdentifier,
        mode: OsUpdateFlowMode.BOOTLOADER_REPAIR,
      }),
    [deviceModelId, transport],
  );

  useEffect(() => {
    trackPage({ category: OsUpdatePage.BOOTLOADER_DETECTED, props: sharedAnalytics });
  }, [sharedAnalytics]);

  const onContinue = useCallback(() => {
    track("button_clicked", {
      button: OsUpdateButton.CONTINUE,
      page: OsUpdatePage.BOOTLOADER_DETECTED,
      ...sharedAnalytics,
    });
    navigation.navigate(ScreenName.OsUpdate, {
      device,
      mode: OsUpdateFlowMode.BOOTLOADER_REPAIR,
    });
  }, [navigation, device, sharedAnalytics]);

  return { onContinue };
}
