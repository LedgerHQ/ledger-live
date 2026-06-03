import React from "react";
import {
  AppInteractionRequiredStateType,
  type EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import { TrackScreen } from "~/analytics";
import { PAGE_CONNECT_APP } from "../../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../../types";
import { OutdatedAppWarningView } from "./OutdatedAppWarningView";
import { useOutdatedAppWarningViewModel } from "./useOutdatedAppWarningViewModel";

type OutdatedAppWarningProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: AppInteractionRequiredStateType.OutdatedAppWarning }>
>;

export function OutdatedAppWarning({ state, device, sourceFlow }: OutdatedAppWarningProps) {
  const viewModel = useOutdatedAppWarningViewModel({ state, device, sourceFlow });
  return (
    <>
      <TrackScreen
        category={PAGE_CONNECT_APP.OutdatedAppWarning}
        sourceFlow={sourceFlow}
        modelId={device.modelId}
        deviceUxV2
      />
      <OutdatedAppWarningView {...viewModel} />
    </>
  );
}
