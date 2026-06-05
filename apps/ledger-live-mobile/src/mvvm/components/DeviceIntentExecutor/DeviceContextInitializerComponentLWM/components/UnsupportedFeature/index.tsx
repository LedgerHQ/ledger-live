import React from "react";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { TrackScreen } from "~/analytics";
import { PAGE_CONNECT_APP } from "../../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../../types";
import { UnsupportedFeatureView } from "./UnsupportedFeatureView";
import { useUnsupportedFeatureViewModel } from "./useUnsupportedFeatureViewModel";

type UnsupportedFeatureProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.UnsupportedFeature }>
>;

export function UnsupportedFeature({ device, sourceFlow }: UnsupportedFeatureProps) {
  const viewModel = useUnsupportedFeatureViewModel({ device, sourceFlow });
  return (
    <>
      <TrackScreen
        category={PAGE_CONNECT_APP.UnsupportedFeature}
        sourceFlow={sourceFlow}
        modelId={device.modelId}
        refreshSource
        deviceUxV2
      />
      <UnsupportedFeatureView {...viewModel} />
    </>
  );
}
