import React from "react";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { TrackDIEScreen } from "../../../components/TrackDIEScreen";
import { PAGE_CONNECT_APP } from "../../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../../types";
import { DeviceNotOnboardedView } from "./DeviceNotOnboardedView";
import { useDeviceNotOnboardedViewModel } from "./useDeviceNotOnboardedViewModel";

type DeviceNotOnboardedProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.DeviceNotOnboarded }>
>;

export function DeviceNotOnboarded({ device }: DeviceNotOnboardedProps) {
  const viewModel = useDeviceNotOnboardedViewModel({ device });
  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_APP.DeviceNotOnboarded}
        modelId={device.modelId}
        refreshSource
      />
      <DeviceNotOnboardedView {...viewModel} />
    </>
  );
}
