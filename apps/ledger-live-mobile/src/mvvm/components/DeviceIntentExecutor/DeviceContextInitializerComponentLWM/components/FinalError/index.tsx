import React from "react";
import { FinalStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { TrackScreen } from "~/analytics";
import { PAGE_CONNECT_APP } from "../../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../../types";
import { FinalErrorView } from "./FinalErrorView";
import { useFinalErrorViewModel } from "./useFinalErrorViewModel";

type FinalErrorProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: FinalStateType.Error }>
>;

export function FinalError({ state, device, sourceFlow, onCancel }: FinalErrorProps) {
  const viewModel = useFinalErrorViewModel({ state, device, sourceFlow, onCancel });
  return (
    <>
      <TrackScreen
        category={PAGE_CONNECT_APP.Error}
        sourceFlow={sourceFlow}
        modelId={device.modelId}
        refreshSource
        deviceUxV2
      />
      <FinalErrorView {...viewModel} />
    </>
  );
}
