import { useCallback } from "react";
import type {
  EnsureAppReadyState,
  AppInteractionRequiredStateType,
} from "@ledgerhq/live-dmk-shared";
import type { InitializerDevice } from "../../types";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import { useDeviceIntentTracking } from "../../../utils/DeviceIntentTrackingContext";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";

type OutdatedAppWarningState = Extract<
  EnsureAppReadyState,
  { type: AppInteractionRequiredStateType.OutdatedAppWarning }
>;

type Params = Readonly<{
  state: OutdatedAppWarningState;
  device: InitializerDevice;
}>;

export function useOutdatedAppWarningViewModel({ state, device }: Params) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const { openMyLedger } = useInitializerActions(device);
  const modelId = device.modelId;

  const onOpenMyLedger = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.ManageApps,
      extraProperties: analyticsProperties,
    });
    openMyLedger(state.appName);
  }, [analyticsProperties, openMyLedger, state.appName, sourceFlow, modelId]);

  const onContinue = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.Continue,
      extraProperties: analyticsProperties,
    });
    state.onContinue();
  }, [analyticsProperties, state, sourceFlow, modelId]);

  return {
    appName: state.appName,
    onOpenMyLedger,
    onContinue,
  };
}
