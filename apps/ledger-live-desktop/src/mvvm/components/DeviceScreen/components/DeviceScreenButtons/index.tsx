import React from "react";
import { DeviceScreenButtonsView } from "./DeviceScreenButtonsView";
import {
  useDeviceScreenButtonsViewModel,
  type DeviceScreenButtonPress,
} from "./useDeviceScreenButtonsViewModel";

export interface DeviceScreenButtonsProps {
  readonly onPress: DeviceScreenButtonPress;
}

export function DeviceScreenButtons({ onPress }: DeviceScreenButtonsProps) {
  return <DeviceScreenButtonsView {...useDeviceScreenButtonsViewModel(onPress)} />;
}
