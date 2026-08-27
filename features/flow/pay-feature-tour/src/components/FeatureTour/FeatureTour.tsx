import React from "react";
import { FeatureTourView } from "./FeatureTourView";
import type { FeatureTourProps } from "./types";
import { useFeatureTourViewModel } from "./useFeatureTourViewModel";

export function FeatureTour(props: FeatureTourProps) {
  return <FeatureTourView {...useFeatureTourViewModel(props)} />;
}
