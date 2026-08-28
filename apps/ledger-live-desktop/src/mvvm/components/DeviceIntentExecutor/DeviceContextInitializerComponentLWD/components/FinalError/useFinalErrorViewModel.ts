import { useCallback } from "react";
import { isDmkError, type DmkError } from "@ledgerhq/live-dmk-desktop";
import {
  useDeviceIntentTracking,
  type EnsureAppReadyState,
  type FinalStateType,
} from "@ledgerhq/live-dmk-shared";
import { CONNECT_APP_BUTTON, trackConnectAppButtonClicked } from "../../../utils/trackDeviceIntent";
import { useInitializerActions } from "../../hooks/useInitializerActions";
import type { InitializerDevice } from "../../types";

type FinalErrorState = Extract<EnsureAppReadyState, { type: FinalStateType.Error }>;

type Params = Readonly<{
  state: FinalErrorState;
  device: InitializerDevice;
  onCancel: () => void;
}>;

export function useFinalErrorViewModel({ state, device, onCancel }: Params) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const { openSupport } = useInitializerActions();

  const onCancelWithTracking = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId: device.modelId,
      button: CONNECT_APP_BUTTON.Close,
      extraProperties: analyticsProperties,
    });
    onCancel();
  }, [analyticsProperties, device.modelId, onCancel, sourceFlow]);

  const onContactSupport = useCallback(() => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId: device.modelId,
      button: CONNECT_APP_BUTTON.ContactLedgerSupport,
      extraProperties: analyticsProperties,
    });
    openSupport();
  }, [analyticsProperties, device.modelId, openSupport, sourceFlow]);

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
