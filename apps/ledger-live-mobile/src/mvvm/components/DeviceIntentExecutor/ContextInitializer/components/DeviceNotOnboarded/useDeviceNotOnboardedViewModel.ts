import { useCallback } from "react";
import type { InitializerDevice } from "../../types";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useDeviceIntentTracking } from "../../../utils/DeviceIntentTrackingContext";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";

type Params = Readonly<{
  device: InitializerDevice;
}>;

export function useDeviceNotOnboardedViewModel({ device }: Params) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const { openOnboarding } = useInitializerActions(device);
  const modelId = device.modelId;

  const onSetupDevice = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.SetUpDevice,
      extraProperties: analyticsProperties,
    });
    openOnboarding();
  }, [analyticsProperties, openOnboarding, sourceFlow, modelId]);

  return {
    productName: device.productName,
    onSetupDevice,
  };
}
