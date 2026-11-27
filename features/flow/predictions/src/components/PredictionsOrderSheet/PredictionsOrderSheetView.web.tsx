import React from "react";
import { useTranslation } from "@shared/i18n";
import { PendingResultSheetView } from "../PendingResultSheet/PendingResultSheetView";
import type { PredictionsOrderSheetViewProps } from "./PredictionsOrderSheet.types";
import { OrderContent } from "./OrderContent";
import { orderTitleKey } from "./orderCopy";

type PredictionsOrderSheetWebViewProps = PredictionsOrderSheetViewProps &
  Readonly<{ onRetry: () => void }>;

export function PredictionsOrderSheetView({
  isOpen,
  shownOrder,
  onPresented,
  onClose,
  onRetry,
}: PredictionsOrderSheetWebViewProps) {
  const { t } = useTranslation();

  return (
    <PendingResultSheetView
      isOpen={isOpen}
      contentKey={shownOrder?.key}
      title={shownOrder ? t(orderTitleKey(shownOrder.result)) : undefined}
      isLocked={shownOrder?.result === null}
      onPresented={onPresented}
      onDismiss={onClose}
      testID="predictions-order-sheet"
    >
      {shownOrder ? (
        <OrderContent
          order={shownOrder.context}
          report={shownOrder.result}
          onClose={onClose}
          onRetry={onRetry}
        />
      ) : null}
    </PendingResultSheetView>
  );
}
