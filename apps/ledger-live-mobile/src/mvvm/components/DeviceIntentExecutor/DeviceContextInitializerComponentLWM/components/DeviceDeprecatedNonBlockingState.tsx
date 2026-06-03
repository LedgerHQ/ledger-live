import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import {
  AppInteractionRequiredStateType,
  type EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import {
  DeviceDeprecationScreen,
  DeviceDeprecationScreens,
} from "~/components/DeviceAction/Screen/DeviceDeprecationScreen";
import { TrackScreen } from "~/analytics";
import {
  CONNECT_APP_BUTTON,
  PAGE_CONNECT_APP,
  trackConnectAppButtonClicked,
} from "../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../types";

type DeviceDeprecatedNonBlockingStateProps = BaseInitializerStateProps<
  Extract<
    EnsureAppReadyState,
    { type: AppInteractionRequiredStateType.DeviceDeprecatedNonBlocking }
  >
>;

export function DeviceDeprecatedNonBlockingState({
  state,
  device,
  sourceFlow,
}: DeviceDeprecatedNonBlockingStateProps) {
  const { decision, onContinue } = state;
  const modelId = device.modelId;
  const displayClearSigningWarning = decision.screenSequence.includes("clearSigning");

  const handleContinue = () => {
    trackConnectAppButtonClicked({ sourceFlow, modelId, button: CONNECT_APP_BUTTON.Continue });
    onContinue();
  };

  return (
    <>
      <TrackScreen
        category={PAGE_CONNECT_APP.DeviceDeprecatedWarning}
        sourceFlow={sourceFlow}
        modelId={modelId}
        deviceUxV2
      />
      <DeviceDeprecationScreen
        coinName={decision.currencyName}
        date={decision.supportEndDate}
        onContinue={handleContinue}
        productName={getDeviceModel(decision.deviceModelId).productName}
        screenName={
          decision.screenSequence.includes("warning")
            ? DeviceDeprecationScreens.warningScreen
            : DeviceDeprecationScreens.clearSigningScreen
        }
        displayClearSigningWarning={displayClearSigningWarning}
      />
    </>
  );
}
