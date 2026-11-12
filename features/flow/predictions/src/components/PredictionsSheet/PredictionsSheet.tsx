import React from "react";
import { PredictionsSheetView } from "./PredictionsSheetView";
import { usePredictionsSheetViewModel } from "./usePredictionsSheetViewModel";

export function PredictionsSheet() {
  return <PredictionsSheetView {...usePredictionsSheetViewModel()} />;
}
