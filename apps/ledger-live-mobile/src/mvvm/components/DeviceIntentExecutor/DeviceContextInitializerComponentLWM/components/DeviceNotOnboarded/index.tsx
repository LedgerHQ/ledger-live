import React from "react";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import type { BaseInitializerStateProps } from "../../types";
import { DeviceNotOnboardedView } from "./DeviceNotOnboardedView";
import { useDeviceNotOnboardedViewModel } from "./useDeviceNotOnboardedViewModel";

type DeviceNotOnboardedProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.DeviceNotOnboarded }>
>;

export function DeviceNotOnboarded({ device }: DeviceNotOnboardedProps) {
  const viewModel = useDeviceNotOnboardedViewModel({ device });
  return <DeviceNotOnboardedView {...viewModel} />;
}
