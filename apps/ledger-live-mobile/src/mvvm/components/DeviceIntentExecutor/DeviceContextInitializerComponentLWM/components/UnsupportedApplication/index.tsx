import React from "react";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { TrackScreen } from "~/analytics";
import { PAGE_CONNECT_APP } from "../../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../../types";
import { UnsupportedApplicationView } from "./UnsupportedApplicationView";
import { useUnsupportedApplicationViewModel } from "./useUnsupportedApplicationViewModel";

type UnsupportedApplicationProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.UnsupportedApplication }>
>;

export function UnsupportedApplication({ device, sourceFlow }: UnsupportedApplicationProps) {
  const viewModel = useUnsupportedApplicationViewModel({ device, sourceFlow });
  return (
    <>
      <TrackScreen
        category={PAGE_CONNECT_APP.UnsupportedApplication}
        sourceFlow={sourceFlow}
        modelId={device.modelId}
        deviceUxV2
      />
      <UnsupportedApplicationView {...viewModel} />
    </>
  );
}
