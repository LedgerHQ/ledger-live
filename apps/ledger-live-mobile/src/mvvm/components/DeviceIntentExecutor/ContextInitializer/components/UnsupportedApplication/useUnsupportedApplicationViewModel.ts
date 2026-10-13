import { useCallback } from "react";
import type { InitializerDevice } from "../../types";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useDeviceIntentTracking } from "../../../utils/DeviceIntentTrackingContext";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";

type Params = Readonly<{
  device: InitializerDevice;
}>;

export function useUnsupportedApplicationViewModel({ device }: Params) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const { openSupport } = useInitializerActions(device);
  const modelId = device.modelId;

  const onContactSupport = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.ContactLedgerSupport,
      extraProperties: analyticsProperties,
    });
    openSupport();
  }, [analyticsProperties, openSupport, sourceFlow, modelId]);

  return {
    onContactSupport,
  };
}
