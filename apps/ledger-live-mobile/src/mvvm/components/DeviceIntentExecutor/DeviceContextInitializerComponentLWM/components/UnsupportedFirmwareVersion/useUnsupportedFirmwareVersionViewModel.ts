import { useCallback } from "react";
import type { InitializerDevice } from "../../types";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useDeviceIntentTracking } from "../../../utils/DeviceIntentTrackingContext";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";

type Params = Readonly<{
  device: InitializerDevice;
  onCancel: () => void;
}>;

export function useUnsupportedFirmwareVersionViewModel({ device, onCancel }: Params) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const { openMyLedgerFirmwareUpdate } = useInitializerActions(device);
  const modelId = device.modelId;

  const onUpdateLedgerOs = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.UpdateFirmware,
      extraProperties: analyticsProperties,
    });
    openMyLedgerFirmwareUpdate();
  }, [analyticsProperties, openMyLedgerFirmwareUpdate, sourceFlow, modelId]);

  const onCancelWithTracking = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.Close,
      extraProperties: analyticsProperties,
    });
    onCancel();
  }, [analyticsProperties, onCancel, sourceFlow, modelId]);

  return {
    onCancel: onCancelWithTracking,
    onUpdateLedgerOs,
  };
}
