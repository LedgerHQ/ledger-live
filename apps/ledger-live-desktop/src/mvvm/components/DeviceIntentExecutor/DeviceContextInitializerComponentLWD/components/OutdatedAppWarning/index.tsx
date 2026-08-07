import React from "react";
import type {
  AppInteractionRequiredStateType,
  EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import type { BaseInitializerStateProps } from "../../types";
import { OutdatedAppWarningView } from "./OutdatedAppWarningView";
import { useOutdatedAppWarningViewModel } from "./useOutdatedAppWarningViewModel";

type OutdatedAppWarningProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: AppInteractionRequiredStateType.OutdatedAppWarning }>
>;

export function OutdatedAppWarning({ state }: OutdatedAppWarningProps) {
  const viewModel = useOutdatedAppWarningViewModel({ state });

  return <OutdatedAppWarningView {...viewModel} />;
}
