import React from "react";
import { useTranslation } from "@shared/i18n";
import { PendingResultScreen } from "../PendingResultSheet/PendingResultScreen";
import type { PredictionsOrderSheetViewProps } from "./PredictionsOrderSheet.types";
import { OrderContent } from "./OrderContent";
import { orderTitleKey } from "./orderCopy";

export function PredictionsOrderSheetView({
  isOpen,
  shownOrder,
  onPresented,
  onClose,
  onRetry,
}: PredictionsOrderSheetViewProps) {
  const { t } = useTranslation();

  return (
    <PendingResultScreen
      isOpen={isOpen}
      contentKey={shownOrder?.key}
      title={shownOrder ? t(orderTitleKey(shownOrder.outcome)) : undefined}
      onPresented={onPresented}
      onDismiss={onClose}
      testID="predictions-order-sheet"
    >
      {shownOrder ? (
        <OrderContent
          order={shownOrder.context}
          outcome={shownOrder.outcome}
          onClose={onClose}
          onRetry={onRetry}
        />
      ) : null}
    </PendingResultScreen>
  );
}
