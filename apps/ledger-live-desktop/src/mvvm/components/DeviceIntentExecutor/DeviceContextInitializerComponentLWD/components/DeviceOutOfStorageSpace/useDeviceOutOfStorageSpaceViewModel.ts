import { useCallback, useMemo } from "react";
import type { BlockingStateType, EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { useInitializerActions } from "../../hooks/useInitializerActions";

type DeviceOutOfStorageSpaceState = Extract<
  EnsureAppReadyState,
  { type: BlockingStateType.DeviceOutOfStorageSpace }
>;

type Params = Readonly<{
  state: DeviceOutOfStorageSpaceState;
}>;

export function useDeviceOutOfStorageSpaceViewModel({ state }: Params) {
  const { openMyLedger } = useInitializerActions();
  const appNamesText = useMemo(() => state.appNames.join(", "), [state.appNames]);

  const onOpenMyLedger = useCallback(() => {
    openMyLedger(appNamesText);
  }, [appNamesText, openMyLedger]);

  return {
    appNamesText,
    onOpenMyLedger,
  };
}
