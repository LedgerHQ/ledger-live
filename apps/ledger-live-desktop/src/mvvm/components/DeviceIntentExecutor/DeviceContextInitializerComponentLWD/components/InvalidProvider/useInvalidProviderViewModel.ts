import { useCallback } from "react";
import { useDeviceIntentTracking } from "@ledgerhq/live-dmk-shared";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import type { InitializerDevice } from "../../types";

type Params = Readonly<{
  device: InitializerDevice;
}>;

export function useInvalidProviderViewModel({ device }: Params) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const { openExperimentalSettings } = useInitializerActions();

  const onGoToSettings = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId: device.modelId,
      button: CONNECT_APP_BUTTON.GoToSettings,
      extraProperties: analyticsProperties,
    });
    openExperimentalSettings();
  }, [analyticsProperties, device.modelId, openExperimentalSettings, sourceFlow]);

  return {
    onGoToSettings,
  };
}
