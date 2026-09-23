import React from "react";
import { FeatureTourView } from "./FeatureTourView";
import { useFeatureTourViewModel } from "./useFeatureTourViewModel";

export function FeatureTour() {
  return <FeatureTourView {...useFeatureTourViewModel()} />;
}
