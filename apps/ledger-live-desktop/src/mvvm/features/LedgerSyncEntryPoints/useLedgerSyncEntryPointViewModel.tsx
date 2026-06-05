import { EntryPoint } from "./types";
import { useEntryPoint } from "./hooks/useEntryPoint";
import { useActivationDrawer } from "./hooks/useActivationDrawer";

export default function useLedgerSyncEntryPointViewModel({
  entryPoint,
  needEligibleDevice,
  onPress,
  onboardingNewDevice,
  variant,
}: {
  entryPoint: EntryPoint;
  needEligibleDevice?: boolean;
  onPress?: () => void;
  onboardingNewDevice?: boolean;
  variant?: "v4";
}) {
  const { shouldDisplayEntryPoint, entryPointData } = useEntryPoint(
    entryPoint,
    needEligibleDevice,
    variant,
  );
  const { openDrawer, closeDrawer } = useActivationDrawer(onboardingNewDevice);

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
