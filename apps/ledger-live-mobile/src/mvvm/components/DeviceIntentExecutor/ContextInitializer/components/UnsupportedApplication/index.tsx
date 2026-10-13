import React from "react";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { TrackDIEScreen } from "../../../components/TrackDIEScreen";
import { PAGE_CONNECT_APP } from "../../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../../types";
import { UnsupportedApplicationView } from "./UnsupportedApplicationView";
import { useUnsupportedApplicationViewModel } from "./useUnsupportedApplicationViewModel";

type UnsupportedApplicationProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.UnsupportedApplication }>
>;

export function UnsupportedApplication({ device }: UnsupportedApplicationProps) {
  const viewModel = useUnsupportedApplicationViewModel({ device });
  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_APP.UnsupportedApplication}
        modelId={device.modelId}
        refreshSource
      />
      <UnsupportedApplicationView {...viewModel} />
    </>
  );
}
