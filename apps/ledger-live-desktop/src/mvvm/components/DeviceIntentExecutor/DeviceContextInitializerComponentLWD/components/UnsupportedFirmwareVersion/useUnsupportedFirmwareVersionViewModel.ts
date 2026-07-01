import { useInitializerActions } from "../../hooks/useInitializerActions";

type Params = Readonly<{
  onCancel: () => void;
}>;

export function useUnsupportedFirmwareVersionViewModel({ onCancel }: Params) {
  const { openMyLedgerFirmwareUpdate } = useInitializerActions();

  return {
    onCancel,
    onUpdateLedgerOs: openMyLedgerFirmwareUpdate,
  };
}
