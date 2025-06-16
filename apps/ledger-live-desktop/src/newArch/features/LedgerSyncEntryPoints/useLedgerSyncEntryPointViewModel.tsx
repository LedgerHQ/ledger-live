import { EntryPoint } from "./types";
import { useEntryPoint } from "./hooks/useEntryPoint";
import { useActivationDrawer } from "./hooks/useActivationDrawer";

export default function useLedgerSyncEntryPointViewModel({
  entryPoint,
  needEligibleDevice,
  onPress,
}: {
  entryPoint: EntryPoint;
  needEligibleDevice?: boolean;
  onPress?: () => void;
}) {
  const { shouldDisplayEntryPoint, entryPointData } = useEntryPoint(entryPoint, needEligibleDevice);
  const { openDrawer, closeDrawer } = useActivationDrawer();

  return {
    shouldDisplayEntryPoint,
    onClickEntryPoint: entryPointData.onClick,
    entryPointComponent: entryPointData.component,
    page: entryPointData.page,
    openDrawer,
    closeDrawer,
    onPress,
  };
}
