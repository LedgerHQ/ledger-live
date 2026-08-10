import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import {
  BlockingStateType,
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

type DeviceDeprecatedBlockingStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.DeviceDeprecatedBlocking }>
>;

export function DeviceDeprecatedBlockingState({
  state,
  device,
}: DeviceDeprecatedBlockingStateProps) {
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const { decision } = state;

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
        category={PAGE_CONNECT_APP.DeviceDeprecatedBlocking}
        modelId={device.modelId}
        refreshSource
      />
      <DeviceDeprecationScreen
        coinName={decision.currencyName}
        date={decision.supportEndDate}
        onUpgrade={() => trackButtonClick(CONNECT_APP_BUTTON.DiscoverUpgradeProgram)}
        onLearnMore={() => trackButtonClick(CONNECT_APP_BUTTON.LearnMore)}
        productName={getDeviceModel(decision.deviceModelId).productName}
        screenName={DeviceDeprecationScreens.errorScreen}
      />
    </>
  );
}
