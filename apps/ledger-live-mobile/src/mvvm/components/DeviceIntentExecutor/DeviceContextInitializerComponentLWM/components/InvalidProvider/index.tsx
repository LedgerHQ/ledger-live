import React from "react";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { TrackDIEScreen } from "../../../components/TrackDIEScreen";
import { PAGE_CONNECT_APP } from "../../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../../types";
import { InvalidProviderView } from "./InvalidProviderView";
import { useInvalidProviderViewModel } from "./useInvalidProviderViewModel";

type InvalidProviderProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.InvalidProvider }>
>;

export function InvalidProvider({ device }: InvalidProviderProps) {
  const viewModel = useInvalidProviderViewModel({ device });

  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_APP.InvalidProvider}
        modelId={device.modelId}
        refreshSource
      />
      <InvalidProviderView {...viewModel} />
    </>
  );
}
