import React from "react";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { TrackScreen } from "~/analytics";
import { PAGE_CONNECT_APP } from "../../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../../types";
import { DeviceNotOnboardedView } from "./DeviceNotOnboardedView";
import { useDeviceNotOnboardedViewModel } from "./useDeviceNotOnboardedViewModel";

type DeviceNotOnboardedProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.DeviceNotOnboarded }>
>;

export function DeviceNotOnboarded({ device, sourceFlow }: DeviceNotOnboardedProps) {
  const viewModel = useDeviceNotOnboardedViewModel({ device, sourceFlow });
  return (
    <>
      <TrackScreen
        category={PAGE_CONNECT_APP.DeviceNotOnboarded}
        sourceFlow={sourceFlow}
        modelId={device.modelId}
        refreshSource
        deviceUxV2
      />
      <DeviceNotOnboardedView {...viewModel} />
    </>
  );
}
