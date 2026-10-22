import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
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

type DeviceDeprecatedBlockingStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.DeviceDeprecatedBlocking }>
>;

export function DeviceDeprecatedBlockingState({
  state,
  device,
}: DeviceDeprecatedBlockingStateProps) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const { decision } = state;
  const modelId = device.modelId;

  const handleLearnMore = () => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.LearnMore,
      extraProperties: analyticsProperties,
    });
  };

  const handleUpgrade = () => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.DiscoverUpgradeProgram,
      extraProperties: analyticsProperties,
    });
  };

  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_APP.DeviceDeprecatedBlocking}
        modelId={modelId}
        refreshSource
      />
      <DeviceDeprecationScreen
        coinName={decision.currencyName}
        date={decision.supportEndDate}
        onContinue={() => undefined}
        onLearnMore={handleLearnMore}
        onUpgrade={handleUpgrade}
        productName={getDeviceModel(decision.deviceModelId).productName}
        screenName={DeviceDeprecationScreens.errorScreen}
      />
    </>
  );
}
