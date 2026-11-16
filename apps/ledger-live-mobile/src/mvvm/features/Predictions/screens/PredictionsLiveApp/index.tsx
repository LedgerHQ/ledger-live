import React from "react";
import { PredictionsLiveAppView } from "./PredictionsLiveAppView";
import { usePredictionsLiveAppViewModel } from "./usePredictionsLiveAppViewModel";

export function PredictionsLiveApp() {
  return <PredictionsLiveAppView {...usePredictionsLiveAppViewModel()} />;
}
