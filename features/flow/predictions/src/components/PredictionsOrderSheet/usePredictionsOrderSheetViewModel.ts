import {
  closePredictionsOrder,
  markPredictionsOrderPresented,
  retryPredictionsOrder,
  usePredictionsOrder,
} from "../../predictionsOrderStore.internals";
import type { PredictionsOrderSheetViewProps } from "./PredictionsOrderSheet.types";

export function usePredictionsOrderSheetViewModel(): PredictionsOrderSheetViewProps {
  const { isOpen, shownOrder } = usePredictionsOrder();

  return {
    isOpen,
    shownOrder,
    onPresented: markPredictionsOrderPresented,
    onClose: closePredictionsOrder,
    onRetry: retryPredictionsOrder,
  };
}
