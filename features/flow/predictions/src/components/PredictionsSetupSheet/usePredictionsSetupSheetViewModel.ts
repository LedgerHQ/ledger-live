import {
  dismissPredictionsSetup,
  markPredictionsSetupPresented,
  usePredictionsSetup,
} from "../../predictionsSetupStore.internals";
import type { PredictionsSetupSheetViewProps } from "./PredictionsSetupSheet.types";

export function usePredictionsSetupSheetViewModel(): PredictionsSetupSheetViewProps {
  const { isOpen, shownSetup } = usePredictionsSetup();

  return {
    isOpen,
    shownSetup,
    onPresented: markPredictionsSetupPresented,
    onDismiss: dismissPredictionsSetup,
  };
}
