import { EntryPoint } from "./types";
import { useEntryPoint } from "./hooks/useEntryPoint";
import { useActivationDrawer } from "./hooks/useActivationDrawer";

export default function useLedgerSyncEntryPointViewModel({
  entryPoint,
  page,
  variant,
}: {
  entryPoint: EntryPoint;
  page: string;
  variant?: "v4";
}) {
  const { shouldDisplayEntryPoint, entryPointData } = useEntryPoint(entryPoint, variant);
  const { isActivationDrawerVisible, openActivationDrawer, closeActivationDrawer } =
    useActivationDrawer();

  return {
    page,
    shouldDisplayEntryPoint,
    onClickEntryPoint: entryPointData.onClick,
    entryPointComponent: entryPointData.component,
    isActivationDrawerVisible,
    openActivationDrawer,
    closeActivationDrawer,
  };
}
