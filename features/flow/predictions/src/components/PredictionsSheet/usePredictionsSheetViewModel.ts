import { dismissPredictionsSheet, usePredictionsStep } from "../../predictionsSheetStore.internals";
import type { PredictionsSheetViewProps } from "./PredictionsSheet.types";

export function usePredictionsSheetViewModel(): PredictionsSheetViewProps {
  const { isOpen, shownStep } = usePredictionsStep();

  return { isOpen, shownStep, onDismiss: dismissPredictionsSheet };
}
