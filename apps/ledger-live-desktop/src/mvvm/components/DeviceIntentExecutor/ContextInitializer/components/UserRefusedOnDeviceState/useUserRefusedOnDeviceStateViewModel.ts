import { useCallback } from "react";
import { useDeviceIntentTracking } from "@ledgerhq/live-dmk-shared/react";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";
import type { InitializerDevice } from "../../types";

type Params = Readonly<{
  device: InitializerDevice;
  onCancel: () => void;
  retry: () => void;
}>;

export function useUserRefusedOnDeviceStateViewModel({ device, onCancel, retry }: Params) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();

  const trackButtonClick = useCallback(
    (button: string) => {
      trackConnectAppButtonClicked({
        sourceFlow,
        modelId: device.modelId,
        button,
        extraProperties: analyticsProperties,
      });
    },
    [analyticsProperties, device.modelId, sourceFlow],
  );

  const onClose = useCallback(() => {
    trackButtonClick(CONNECT_APP_BUTTON.Close);
    onCancel();
  }, [onCancel, trackButtonClick]);

  const onRetry = useCallback(() => {
    trackButtonClick(CONNECT_APP_BUTTON.Retry);
    retry();
  }, [retry, trackButtonClick]);

  return { onClose, onRetry };
}
