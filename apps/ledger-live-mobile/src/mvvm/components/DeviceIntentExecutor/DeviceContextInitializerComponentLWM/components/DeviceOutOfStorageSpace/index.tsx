import React from "react";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import type { BaseInitializerStateProps } from "../../types";
import { DeviceOutOfStorageSpaceView } from "./DeviceOutOfStorageSpaceView";
import { useDeviceOutOfStorageSpaceViewModel } from "./useDeviceOutOfStorageSpaceViewModel";

type DeviceOutOfStorageSpaceProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.DeviceOutOfStorageSpace }>
>;

export function DeviceOutOfStorageSpace({ state, device }: DeviceOutOfStorageSpaceProps) {
  const viewModel = useDeviceOutOfStorageSpaceViewModel({ state, device });
  return <DeviceOutOfStorageSpaceView {...viewModel} />;
}
