import { useCallback } from "react";
import type { InitializerDevice } from "../../types";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useDeviceIntentTracking } from "../../../utils/DeviceIntentTrackingContext";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";

type Params = Readonly<{
  device: InitializerDevice;
}>;

export function useInvalidProviderViewModel({ device }: Params) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const { openExperimentalSettings } = useInitializerActions(device);
  const modelId = device.modelId;

  const onGoToSettings = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.GoToSettings,
      extraProperties: analyticsProperties,
    });
    openExperimentalSettings();
  }, [analyticsProperties, openExperimentalSettings, sourceFlow, modelId]);

  return {
    onGoToSettings,
  };
}
