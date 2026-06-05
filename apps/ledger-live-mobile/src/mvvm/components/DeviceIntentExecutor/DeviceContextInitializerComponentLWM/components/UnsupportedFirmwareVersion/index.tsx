import React from "react";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { TrackScreen } from "~/analytics";
import { PAGE_CONNECT_APP } from "../../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../../types";
import { UnsupportedFirmwareVersionView } from "./UnsupportedFirmwareVersionView";
import { useUnsupportedFirmwareVersionViewModel } from "./useUnsupportedFirmwareVersionViewModel";

type UnsupportedFirmwareVersionProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.UnsupportedFirmwareVersion }>
>;

export function UnsupportedFirmwareVersion({
  device,
  sourceFlow,
  onCancel,
}: UnsupportedFirmwareVersionProps) {
  const viewModel = useUnsupportedFirmwareVersionViewModel({
    device,
    sourceFlow,
    onCancel,
  });
  return (
    <>
      <TrackScreen
        category={PAGE_CONNECT_APP.UnsupportedFirmware}
        sourceFlow={sourceFlow}
        modelId={device.modelId}
        refreshSource
        deviceUxV2
      />
      <UnsupportedFirmwareVersionView {...viewModel} />
    </>
  );
}
