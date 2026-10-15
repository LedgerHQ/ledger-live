import React from "react";
import {
  AppInteractionRequiredStateType,
  type EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import { TrackDIEScreen } from "../../../components/TrackDIEScreen";
import { PAGE_CONNECT_APP } from "../../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../../types";
import { OutdatedAppWarningView } from "./OutdatedAppWarningView";
import { useOutdatedAppWarningViewModel } from "./useOutdatedAppWarningViewModel";

type OutdatedAppWarningProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: AppInteractionRequiredStateType.OutdatedAppWarning }>
>;

export function OutdatedAppWarning({ state, device }: OutdatedAppWarningProps) {
  const viewModel = useOutdatedAppWarningViewModel({ state, device });
  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_APP.OutdatedAppWarning}
        modelId={device.modelId}
        refreshSource
      />
      <OutdatedAppWarningView {...viewModel} />
    </>
  );
}
