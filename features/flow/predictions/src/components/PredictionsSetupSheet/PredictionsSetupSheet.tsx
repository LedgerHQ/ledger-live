import React from "react";
import { PredictionsSetupSheetView } from "./PredictionsSetupSheetView";
import { usePredictionsSetupSheetViewModel } from "./usePredictionsSetupSheetViewModel";

export function PredictionsSetupSheet() {
  return <PredictionsSetupSheetView {...usePredictionsSetupSheetViewModel()} />;
}
