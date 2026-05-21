import type { InitializerDevice } from "../../types";
import { useInitializerActions } from "../../hooks/useInitializerActions";

type Params = Readonly<{
  device: InitializerDevice;
  onCancel: () => void;
}>;

export function useUnsupportedFirmwareVersionViewModel({ device, onCancel }: Params) {
  const { openMyLedgerFirmwareUpdate } = useInitializerActions(device);

  return {
    onCancel,
    onUpdateLedgerOs: openMyLedgerFirmwareUpdate,
  };
}
