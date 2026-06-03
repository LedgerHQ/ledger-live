import { useMemo, useCallback } from "react";
import type { BlockingStateType, EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import type { InitializerDevice } from "../../types";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import type { SourceFlow } from "../../../utils/SourceFlowContext";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";

type DeviceOutOfStorageSpaceState = Extract<
  EnsureAppReadyState,
  { type: BlockingStateType.DeviceOutOfStorageSpace }
>;

type Params = Readonly<{
  state: DeviceOutOfStorageSpaceState;
  device: InitializerDevice;
  sourceFlow: SourceFlow;
}>;

export function useDeviceOutOfStorageSpaceViewModel({ state, device, sourceFlow }: Params) {
  const { openMyLedger } = useInitializerActions(device);
  const modelId = device.modelId;
  const searchQuery = useMemo(() => state.appNames.join(", "), [state.appNames]);
  const onOpenMyLedger = useCallback(() => {
    trackConnectAppButtonClicked({ sourceFlow, modelId, button: CONNECT_APP_BUTTON.ManageApps });
    openMyLedger(searchQuery);
  }, [openMyLedger, searchQuery, sourceFlow, modelId]);

  return {
    onOpenMyLedger,
  };
}
