import React from "react";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { TrackScreen } from "~/analytics";
import { PAGE_CONNECT_APP } from "../../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../../types";
import { DeviceOutOfStorageSpaceView } from "./DeviceOutOfStorageSpaceView";
import { useDeviceOutOfStorageSpaceViewModel } from "./useDeviceOutOfStorageSpaceViewModel";

type DeviceOutOfStorageSpaceProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.DeviceOutOfStorageSpace }>
>;

export function DeviceOutOfStorageSpace({
  state,
  device,
  sourceFlow,
}: DeviceOutOfStorageSpaceProps) {
  const viewModel = useDeviceOutOfStorageSpaceViewModel({
    state,
    device,
    sourceFlow,
  });
  return (
    <>
      <TrackScreen
        category={PAGE_CONNECT_APP.OutOfStorage}
        sourceFlow={sourceFlow}
        modelId={device.modelId}
        refreshSource
        deviceUxV2
      />
      <DeviceOutOfStorageSpaceView {...viewModel} />
    </>
  );
}
