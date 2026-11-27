import React from "react";
import { PredictionsOrderSheetView } from "./PredictionsOrderSheetView";
import { usePredictionsOrderSheetViewModel } from "./usePredictionsOrderSheetViewModel";

export function PredictionsOrderSheet() {
  return <PredictionsOrderSheetView {...usePredictionsOrderSheetViewModel()} />;
}
