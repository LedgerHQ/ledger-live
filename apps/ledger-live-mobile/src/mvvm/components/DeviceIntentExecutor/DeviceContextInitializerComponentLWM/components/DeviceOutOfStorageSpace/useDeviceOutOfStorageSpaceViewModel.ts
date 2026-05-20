import { useMemo, useCallback } from "react";
import type { BlockingStateType, EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import type { InitializerDevice } from "../../types";
import { useInitializerActions } from "../../hooks/useInitializerActions";

type DeviceOutOfStorageSpaceState = Extract<
  EnsureAppReadyState,
  { type: BlockingStateType.DeviceOutOfStorageSpace }
>;

type Params = Readonly<{
  state: DeviceOutOfStorageSpaceState;
  device: InitializerDevice;
}>;

export function useDeviceOutOfStorageSpaceViewModel({ state, device }: Params) {
  const { openMyLedger } = useInitializerActions(device);
  const searchQuery = useMemo(() => state.appNames.join(", "), [state.appNames]);
  const onOpenMyLedger = useCallback(() => openMyLedger(searchQuery), [openMyLedger, searchQuery]);

  return {
    onOpenMyLedger,
  };
}
