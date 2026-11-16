import { useCallback, useMemo } from "react";
import type { BlockingStateType, EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { useDeviceIntentTracking } from "@ledgerhq/live-dmk-shared/react";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import type { InitializerDevice } from "../../types";

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
  const { openMyLedger } = useInitializerActions();
  const appNamesText = useMemo(() => state.appNames.join(", "), [state.appNames]);

  const onOpenMyLedger = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId: device.modelId,
      button: CONNECT_APP_BUTTON.ManageApps,
      extraProperties: analyticsProperties,
    });
    openMyLedger(appNamesText);
  }, [analyticsProperties, appNamesText, device.modelId, openMyLedger, sourceFlow]);

  return {
    appNamesText,
    onOpenMyLedger,
  };
}
