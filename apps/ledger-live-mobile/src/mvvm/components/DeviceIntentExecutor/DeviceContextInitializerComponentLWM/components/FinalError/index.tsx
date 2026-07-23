import React from "react";
import { FinalStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { TrackDIEScreen } from "../../../components/TrackDIEScreen";
import { PAGE_CONNECT_APP } from "../../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../../types";
import { FinalErrorView } from "./FinalErrorView";
import { useFinalErrorViewModel } from "./useFinalErrorViewModel";

type FinalErrorProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: FinalStateType.Error }>
>;

export function FinalError({ state, device, onCancel }: FinalErrorProps) {
  const viewModel = useFinalErrorViewModel({ state, device, onCancel });
  return (
    <>
      <TrackDIEScreen category={PAGE_CONNECT_APP.Error} modelId={device.modelId} refreshSource />
      <FinalErrorView {...viewModel} />
    </>
  );
}
