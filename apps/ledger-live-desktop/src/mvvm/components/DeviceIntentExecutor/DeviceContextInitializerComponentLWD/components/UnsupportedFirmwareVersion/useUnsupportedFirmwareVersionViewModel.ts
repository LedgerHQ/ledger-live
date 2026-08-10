import { useCallback } from "react";
import { useDeviceIntentTracking } from "@ledgerhq/live-dmk-shared";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import type { InitializerDevice } from "../../types";

type Params = Readonly<{
  device: InitializerDevice;
  onCancel: () => void;
}>;

export function useUnsupportedFirmwareVersionViewModel({ device, onCancel }: Params) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const { openMyLedgerFirmwareUpdate } = useInitializerActions();

  const onUpdateLedgerOs = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId: device.modelId,
      button: CONNECT_APP_BUTTON.UpdateFirmware,
      extraProperties: analyticsProperties,
    });
    openMyLedgerFirmwareUpdate();
  }, [analyticsProperties, device.modelId, openMyLedgerFirmwareUpdate, sourceFlow]);

  const onCancelWithTracking = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId: device.modelId,
      button: CONNECT_APP_BUTTON.Close,
      extraProperties: analyticsProperties,
    });
    onCancel();
  }, [analyticsProperties, device.modelId, onCancel, sourceFlow]);

  return {
    onCancel: onCancelWithTracking,
    onUpdateLedgerOs,
  };
}
