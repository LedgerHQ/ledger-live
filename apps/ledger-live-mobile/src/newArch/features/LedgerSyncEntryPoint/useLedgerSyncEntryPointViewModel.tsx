import { EntryPoint } from "./types";
import { useEntryPoint } from "./hooks/useEntryPoint";
import { useActivationDrawer } from "./hooks/useActivationDrawer";

export default function useLedgerSyncEntryPointViewModel({
  entryPoint,
  page,
}: {
  entryPoint: EntryPoint;
  page: string;
}) {
  const { shouldDisplayEntryPoint, entryPointData } = useEntryPoint(entryPoint);
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
