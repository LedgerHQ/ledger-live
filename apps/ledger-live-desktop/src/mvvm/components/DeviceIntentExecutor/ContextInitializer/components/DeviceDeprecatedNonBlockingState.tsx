import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import {
  AppInteractionRequiredStateType,
  type EnsureAppReadyState,
  useDeviceIntentTracking,
} from "@ledgerhq/live-dmk-shared";
import {
  DeviceDeprecationScreen,
  DeviceDeprecationScreens,
} from "~/renderer/components/DeviceAction/Screen/DeviceDeprecationScreen";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
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
}: DeviceDeprecatedNonBlockingStateProps) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const { decision, onContinue } = state;
  const displayClearSigningWarning = decision.screenSequence.includes("clearSigning");

  const trackButtonClick = (button: string) => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId: device.modelId,
      button,
      extraProperties: analyticsProperties,
    });
  };

  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_APP.DeviceDeprecatedWarning}
        modelId={device.modelId}
        refreshSource
      />
      <DeviceDeprecationScreen
        coinName={decision.currencyName}
        date={decision.supportEndDate}
        onContinue={() => {
          trackButtonClick(CONNECT_APP_BUTTON.Continue);
          onContinue();
        }}
        onUpgrade={() => trackButtonClick(CONNECT_APP_BUTTON.DiscoverUpgradeProgram)}
        onLearnMore={() => trackButtonClick(CONNECT_APP_BUTTON.LearnMore)}
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
