import { useMemo, useCallback } from "react";
import type { BlockingStateType, EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import type { InitializerDevice } from "../../types";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useDeviceIntentTracking } from "../../../utils/DeviceIntentTrackingContext";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";

type DeviceOutOfStorageSpaceState = Extract<
  EnsureAppReadyState,
  { type: BlockingStateType.DeviceOutOfStorageSpace }
>;

type Params = Readonly<{
  state: DeviceOutOfStorageSpaceState;
  device: InitializerDevice;
}>;

export function useDeviceOutOfStorageSpaceViewModel({ state, device }: Params) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const { openMyLedger } = useInitializerActions(device);
  const modelId = device.modelId;
  const searchQuery = useMemo(() => state.appNames.join(", "), [state.appNames]);
  const onOpenMyLedger = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.ManageApps,
      extraProperties: analyticsProperties,
    });
    openMyLedger(searchQuery);
  }, [analyticsProperties, openMyLedger, searchQuery, sourceFlow, modelId]);

  return {
    onOpenMyLedger,
  };
}
