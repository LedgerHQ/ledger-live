import React from "react";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { TrackDIEScreen } from "../../../components/TrackDIEScreen";
import { PAGE_CONNECT_APP } from "../../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../../types";
import { UnsupportedFirmwareVersionView } from "./UnsupportedFirmwareVersionView";
import { useUnsupportedFirmwareVersionViewModel } from "./useUnsupportedFirmwareVersionViewModel";

type UnsupportedFirmwareVersionProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.UnsupportedFirmwareVersion }>
>;

export function UnsupportedFirmwareVersion({ device, onCancel }: UnsupportedFirmwareVersionProps) {
  const viewModel = useUnsupportedFirmwareVersionViewModel({
    device,
    onCancel,
  });
  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_APP.UnsupportedFirmware}
        modelId={device.modelId}
        refreshSource
      />
      <UnsupportedFirmwareVersionView {...viewModel} />
    </>
  );
}
