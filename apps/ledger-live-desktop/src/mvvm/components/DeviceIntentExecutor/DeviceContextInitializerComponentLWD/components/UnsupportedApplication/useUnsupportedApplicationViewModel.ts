import { useCallback } from "react";
import { useDeviceIntentTracking } from "@ledgerhq/live-dmk-shared";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import type { InitializerDevice } from "../../types";

type Params = Readonly<{
  device: InitializerDevice;
}>;

export function useUnsupportedApplicationViewModel({ device }: Params) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const { openSupport } = useInitializerActions();

  const onContactSupport = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId: device.modelId,
      button: CONNECT_APP_BUTTON.ContactLedgerSupport,
      extraProperties: analyticsProperties,
    });
    openSupport();
  }, [analyticsProperties, device.modelId, openSupport, sourceFlow]);

  return {
    onContactSupport,
  };
}
