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
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { useDeviceIntentTracking } from "../../utils/DeviceIntentTrackingContext";
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
  const modelId = device.modelId;
  const displayClearSigningWarning = decision.screenSequence.includes("clearSigning");

  const handleContinue = () => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.Continue,
      extraProperties: analyticsProperties,
    });
    onContinue();
  };

  const handleUpgrade = () => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.DiscoverUpgradeProgram,
      extraProperties: analyticsProperties,
    });
  };

  const handleLearnMore = () => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.LearnMore,
      extraProperties: analyticsProperties,
    });
  };

  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_APP.DeviceDeprecatedWarning}
        modelId={modelId}
        refreshSource
      />
      <DeviceDeprecationScreen
        coinName={decision.currencyName}
        date={decision.supportEndDate}
        onContinue={handleContinue}
        onUpgrade={handleUpgrade}
        onLearnMore={handleLearnMore}
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
