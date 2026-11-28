import { useCallback } from "react";
import type { InitializerDevice } from "../../types";
import { useDeviceIntentTracking } from "../../../utils/DeviceIntentTrackingContext";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";

type Params = Readonly<{
  device: InitializerDevice;
  onCancel: () => void;
  retry: () => void;
}>;

export function useUserRefusedOnDeviceStateViewModel({ device, onCancel, retry }: Params) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const modelId = device.modelId;

  const onClose = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.Close,
      extraProperties: analyticsProperties,
    });
    onCancel();
  }, [analyticsProperties, modelId, onCancel, sourceFlow]);

  const onRetry = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.Retry,
      extraProperties: analyticsProperties,
    });
    retry();
  }, [analyticsProperties, modelId, retry, sourceFlow]);

  return { onClose, onRetry };
}
