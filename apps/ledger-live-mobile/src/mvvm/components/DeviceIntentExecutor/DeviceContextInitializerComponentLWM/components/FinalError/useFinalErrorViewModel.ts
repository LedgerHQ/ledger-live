import { useCallback } from "react";
import { isDmkError, type DmkError } from "@ledgerhq/live-dmk-mobile";
import type { FinalStateType, EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import type { InitializerDevice } from "../../types";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import type { SourceFlow } from "../../../utils/SourceFlowContext";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";

type FinalErrorState = Extract<EnsureAppReadyState, { type: FinalStateType.Error }>;

type Params = Readonly<{
  state: FinalErrorState;
  device: InitializerDevice;
  sourceFlow: SourceFlow;
  onCancel: () => void;
}>;

export function useFinalErrorViewModel({ state, device, sourceFlow, onCancel }: Params) {
  const { openSupport } = useInitializerActions(device);
  const modelId = device.modelId;

  const onCancelWithTracking = useCallback(() => {
    trackConnectAppButtonClicked({ sourceFlow, modelId, button: CONNECT_APP_BUTTON.Close });
    onCancel();
  }, [onCancel, sourceFlow, modelId]);

  const onContactSupport = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.ContactLedgerSupport,
    });
    openSupport();
  }, [openSupport, sourceFlow, modelId]);

  return {
    error: getTranslatedErrorInput(state.error),
    onCancel: onCancelWithTracking,
    onContactSupport,
  };
}

function getTranslatedErrorInput(error: unknown): Error | DmkError {
  if (error instanceof Error || isDmkError(error)) {
    return error;
  }

  return new Error("Unknown error");
}
