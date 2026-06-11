import { useCallback } from "react";
import type {
  EnsureAppReadyState,
  AppInteractionRequiredStateType,
} from "@ledgerhq/live-dmk-shared";
import type { InitializerDevice } from "../../types";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import type { SourceFlow } from "../../../utils/SourceFlowContext";
import {
  CONNECT_APP_BUTTON,
  trackConnectAppButtonClicked,
} from "../../../utils/trackDeviceIntent";

type OutdatedAppWarningState = Extract<
  EnsureAppReadyState,
  { type: AppInteractionRequiredStateType.OutdatedAppWarning }
>;

type Params = Readonly<{
  state: OutdatedAppWarningState;
  device: InitializerDevice;
  sourceFlow: SourceFlow;
}>;

export function useOutdatedAppWarningViewModel({ state, device, sourceFlow }: Params) {
  const { openMyLedger } = useInitializerActions(device);
  const modelId = device.modelId;

  const onOpenMyLedger = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.ManageApps,
    });
    openMyLedger(state.appName);
  }, [openMyLedger, state.appName, sourceFlow, modelId]);

  const onContinue = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.Continue,
    });
    state.onContinue();
  }, [state, sourceFlow, modelId]);

  return {
    appName: state.appName,
    onOpenMyLedger,
    onContinue,
  };
}
