import { EntryPoint } from "./types";
import { useEntryPoint } from "./hooks/useEntryPoint";
import { useActivationDrawer } from "./hooks/useActivationDrawer";

export default function useLedgerSyncEntryPointViewModel({
  entryPoint,
  needEligibleDevice,
  onPress,
  skipFirstScreen,
}: {
  entryPoint: EntryPoint;
  needEligibleDevice?: boolean;
  onPress?: () => void;
  skipFirstScreen?: boolean;
}) {
  const { shouldDisplayEntryPoint, entryPointData } = useEntryPoint(entryPoint, needEligibleDevice);
  const { openDrawer, closeDrawer } = useActivationDrawer(skipFirstScreen);

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
