import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
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

type DeviceDeprecatedBlockingStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.DeviceDeprecatedBlocking }>
>;

export function DeviceDeprecatedBlockingState({
  state,
  device,
  sourceFlow,
}: DeviceDeprecatedBlockingStateProps) {
  const { decision } = state;
  const modelId = device.modelId;

  const handleLearnMore = () => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.LearnMore,
    });
  };

  const handleUpgrade = () => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId,
      button: CONNECT_APP_BUTTON.DiscoverUpgradeProgram,
    });
  };

  return (
    <>
      <TrackScreen
        category={PAGE_CONNECT_APP.DeviceDeprecatedBlocking}
        sourceFlow={sourceFlow}
        modelId={modelId}
        refreshSource
        deviceUxV2
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
