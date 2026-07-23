import React from "react";
import { FeatureTourView } from "./FeatureTourView.native";
import { type FeatureTourProps, useFeatureTourViewModel } from "./useFeatureTourViewModel";

export function FeatureTour(props: FeatureTourProps) {
  return <FeatureTourView {...useFeatureTourViewModel(props)} />;
}
