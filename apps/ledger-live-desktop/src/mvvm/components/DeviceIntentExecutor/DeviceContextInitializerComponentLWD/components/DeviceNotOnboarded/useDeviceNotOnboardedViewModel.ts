import { useCallback } from "react";
import { useDeviceIntentTracking } from "@ledgerhq/live-dmk-shared";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";
import type { InitializerDevice } from "../../types";
import { useInitializerActions } from "../../hooks/useInitializerActions";

type Params = Readonly<{
  device: InitializerDevice;
}>;

export function useDeviceNotOnboardedViewModel({ device }: Params) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const { openOnboarding } = useInitializerActions();

  const onSetupDevice = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId: device.modelId,
      button: CONNECT_APP_BUTTON.SetUpDevice,
      extraProperties: analyticsProperties,
    });
    openOnboarding();
  }, [analyticsProperties, device.modelId, openOnboarding, sourceFlow]);

  return {
    productName: device.productName,
    onSetupDevice,
  };
}
