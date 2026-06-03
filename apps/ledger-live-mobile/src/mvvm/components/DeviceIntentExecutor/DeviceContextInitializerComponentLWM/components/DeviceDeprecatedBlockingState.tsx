import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import {
  DeviceDeprecationScreen,
  DeviceDeprecationScreens,
} from "~/components/DeviceAction/Screen/DeviceDeprecationScreen";
import { TrackScreen } from "~/analytics";
import { PAGE_CONNECT_APP } from "../../utils/trackDeviceIntent";
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

  return (
    <>
      <TrackScreen
        category={PAGE_CONNECT_APP.DeviceDeprecatedBlocking}
        sourceFlow={sourceFlow}
        modelId={device.modelId}
        deviceUxV2
      />
      <DeviceDeprecationScreen
        coinName={decision.currencyName}
        date={decision.supportEndDate}
        onContinue={() => undefined}
        productName={getDeviceModel(decision.deviceModelId).productName}
        screenName={DeviceDeprecationScreens.errorScreen}
      />
    </>
  );
}
