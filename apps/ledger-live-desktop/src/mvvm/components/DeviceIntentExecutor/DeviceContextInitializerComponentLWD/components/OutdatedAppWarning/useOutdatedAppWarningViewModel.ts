import { useCallback } from "react";
import {
  useDeviceIntentTracking,
  type AppInteractionRequiredStateType,
  type EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import type { InitializerDevice } from "../../types";

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
  const { openMyLedger } = useInitializerActions();

  const onOpenMyLedger = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId: device.modelId,
      button: CONNECT_APP_BUTTON.ManageApps,
      extraProperties: analyticsProperties,
    });
    openMyLedger(state.appName);
  }, [analyticsProperties, device.modelId, openMyLedger, sourceFlow, state.appName]);

  const onContinue = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId: device.modelId,
      button: CONNECT_APP_BUTTON.Continue,
      extraProperties: analyticsProperties,
    });
    state.onContinue();
  }, [analyticsProperties, device.modelId, sourceFlow, state]);

  return {
    appName: state.appName,
    onOpenMyLedger,
    onContinue,
  };
}
