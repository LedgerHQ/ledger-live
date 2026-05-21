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
import type { BaseInitializerStateProps } from "../types";

type DeviceDeprecatedNonBlockingStateProps = BaseInitializerStateProps<
  Extract<
    EnsureAppReadyState,
    { type: AppInteractionRequiredStateType.DeviceDeprecatedNonBlocking }
  >
>;

export function DeviceDeprecatedNonBlockingState({ state }: DeviceDeprecatedNonBlockingStateProps) {
  const { decision, onContinue } = state;
  const displayClearSigningWarning = decision.screenSequence.includes("clearSigning");

  return (
    <DeviceDeprecationScreen
      coinName={decision.currencyName}
      date={decision.supportEndDate}
      onContinue={onContinue}
      productName={getDeviceModel(decision.deviceModelId).productName}
      screenName={
        decision.screenSequence.includes("warning")
          ? DeviceDeprecationScreens.warningScreen
          : DeviceDeprecationScreens.clearSigningScreen
      }
      displayClearSigningWarning={displayClearSigningWarning}
    />
  );
}
