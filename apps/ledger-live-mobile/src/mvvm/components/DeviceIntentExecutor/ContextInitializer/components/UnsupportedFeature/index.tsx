import React from "react";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { TrackDIEScreen } from "../../../components/TrackDIEScreen";
import { PAGE_CONNECT_APP } from "../../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../../types";
import { UnsupportedFeatureView } from "./UnsupportedFeatureView";
import { useUnsupportedFeatureViewModel } from "./useUnsupportedFeatureViewModel";

type UnsupportedFeatureProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.UnsupportedFeature }>
>;

export function UnsupportedFeature({ device }: UnsupportedFeatureProps) {
  const viewModel = useUnsupportedFeatureViewModel({ device });
  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_APP.UnsupportedFeature}
        modelId={device.modelId}
        refreshSource
      />
      <UnsupportedFeatureView {...viewModel} />
    </>
  );
}
