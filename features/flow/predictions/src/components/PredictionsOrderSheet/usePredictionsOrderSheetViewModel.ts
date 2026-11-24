import {
  closePredictionsOrder,
  markPredictionsOrderPresented,
  markPredictionsOrderSheetHidden,
  retryPredictionsOrder,
  usePredictionsOrder,
} from "../../predictionsOrderStore.internals";
import type { PredictionsOrderSheetViewProps } from "./PredictionsOrderSheet.types";

export function usePredictionsOrderSheetViewModel(): PredictionsOrderSheetViewProps &
  Readonly<{ onHidden: () => void; onRetry: () => void }> {
  const { isOpen, shownOrder } = usePredictionsOrder();

  return {
    isOpen,
    shownOrder,
    onPresented: markPredictionsOrderPresented,
    onHidden: markPredictionsOrderSheetHidden,
    onClose: closePredictionsOrder,
    onRetry: retryPredictionsOrder,
  };
}
