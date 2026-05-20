import React from "react";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import type { BaseInitializerStateProps } from "../../types";
import { UnsupportedApplicationView } from "./UnsupportedApplicationView";
import { useUnsupportedApplicationViewModel } from "./useUnsupportedApplicationViewModel";

type UnsupportedApplicationProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.UnsupportedApplication }>
>;

export function UnsupportedApplication({ device }: UnsupportedApplicationProps) {
  const viewModel = useUnsupportedApplicationViewModel({ device });
  return <UnsupportedApplicationView {...viewModel} />;
}
