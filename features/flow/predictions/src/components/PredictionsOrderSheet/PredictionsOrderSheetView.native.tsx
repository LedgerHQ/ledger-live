import React from "react";
import { PendingResultSheetView } from "../PendingResultSheet/PendingResultSheetView";
import type { PredictionsOrderSheetViewProps } from "./PredictionsOrderSheet.types";
import { OrderPlacing } from "./OrderPlacing";

type PredictionsOrderSheetNativeViewProps = PredictionsOrderSheetViewProps &
  Readonly<{ onHidden: () => void }>;

/** Only the placing order: its result opens on a page once the sheet has left the screen. */
export function PredictionsOrderSheetView({
  isOpen,
  shownOrder,
  onPresented,
  onHidden,
  onClose,
}: PredictionsOrderSheetNativeViewProps) {
  return (
    <PendingResultSheetView
      isOpen={isOpen && shownOrder?.result === null}
      contentKey={shownOrder ? String(shownOrder.id) : undefined}
      isLocked
      onPresented={onPresented}
      onHidden={onHidden}
      onDismiss={onClose}
      testID="predictions-order-sheet"
    >
      <OrderPlacing />
    </PendingResultSheetView>
  );
}
