import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import {
  DeviceDeprecationScreen,
  DeviceDeprecationScreens,
} from "~/components/DeviceAction/Screen/DeviceDeprecationScreen";
import type { BaseInitializerStateProps } from "../types";

type DeviceDeprecatedBlockingStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.DeviceDeprecatedBlocking }>
>;

export function DeviceDeprecatedBlockingState({ state }: DeviceDeprecatedBlockingStateProps) {
  const { decision } = state;

  return (
    <DeviceDeprecationScreen
      coinName={decision.currencyName}
      date={decision.supportEndDate}
      onContinue={() => undefined}
      productName={getDeviceModel(decision.deviceModelId).productName}
      screenName={DeviceDeprecationScreens.errorScreen}
    />
  );
}
