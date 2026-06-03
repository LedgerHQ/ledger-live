import { useCallback } from "react";
import type { InitializerDevice } from "../../types";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import type { SourceFlow } from "../../../utils/SourceFlowContext";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";

type Params = Readonly<{
  device: InitializerDevice;
  sourceFlow: SourceFlow;
  onCancel: () => void;
}>;

export function useUnsupportedFirmwareVersionViewModel({ device, sourceFlow, onCancel }: Params) {
  const { openMyLedgerFirmwareUpdate } = useInitializerActions(device);
  const modelId = device.modelId;

  const onUpdateLedgerOs = useCallback(() => {
    trackConnectAppButtonClicked({ sourceFlow, modelId, button: CONNECT_APP_BUTTON.UpdateFirmware });
    openMyLedgerFirmwareUpdate();
  }, [openMyLedgerFirmwareUpdate, sourceFlow, modelId]);

  const onCancelWithTracking = useCallback(() => {
    trackConnectAppButtonClicked({ sourceFlow, modelId, button: CONNECT_APP_BUTTON.Cancel });
    onCancel();
  }, [onCancel, sourceFlow, modelId]);

  return {
    onCancel: onCancelWithTracking,
    onUpdateLedgerOs,
  };
}
