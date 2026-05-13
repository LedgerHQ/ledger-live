import React from "react";
import { FinalStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import type { BaseInitializerStateProps } from "../../types";
import { FinalErrorView } from "./FinalErrorView";
import { useFinalErrorViewModel } from "./useFinalErrorViewModel";

type FinalErrorProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: FinalStateType.Error }>
>;

export function FinalError({ state, device, onCancel }: FinalErrorProps) {
  const viewModel = useFinalErrorViewModel({ state, device, onCancel });
  return <FinalErrorView {...viewModel} />;
}
