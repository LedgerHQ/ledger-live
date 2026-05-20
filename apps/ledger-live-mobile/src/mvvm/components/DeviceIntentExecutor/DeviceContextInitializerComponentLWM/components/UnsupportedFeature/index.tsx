import React from "react";
import { BlockingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import type { BaseInitializerStateProps } from "../../types";
import { UnsupportedFeatureView } from "./UnsupportedFeatureView";
import { useUnsupportedFeatureViewModel } from "./useUnsupportedFeatureViewModel";

type UnsupportedFeatureProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: BlockingStateType.UnsupportedFeature }>
>;

export function UnsupportedFeature({ device }: UnsupportedFeatureProps) {
  const viewModel = useUnsupportedFeatureViewModel({ device });
  return <UnsupportedFeatureView {...viewModel} />;
}
