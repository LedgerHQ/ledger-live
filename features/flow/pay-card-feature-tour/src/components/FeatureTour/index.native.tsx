import React from "react";
import { FeatureTourView } from "./FeatureTourView.native";
import { type FeatureTourProps, useFeatureTourViewModel } from "./useFeatureTourViewModel";

export function FeatureTour(props: FeatureTourProps) {
  return <FeatureTourView {...useFeatureTourViewModel(props)} />;
}

export type {
  FeatureTourContent,
  FeatureTourProps,
  FeatureTourRow,
  FeatureTourRowIcon,
  PayCardTrackEvent,
  PayCardTrackScreen,
} from "./useFeatureTourViewModel";
