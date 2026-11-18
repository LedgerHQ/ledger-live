import React from "react";
import { useTranslation } from "@shared/i18n";
import { PendingResultSheetView } from "../PendingResultSheet/PendingResultSheetView";
import type { PredictionsSetupSheetViewProps } from "./PredictionsSetupSheet.types";
import { SetupContent } from "./SetupContent";
import { setupTitleKey } from "./setupTitleKey";

export function PredictionsSetupSheetView({
  isOpen,
  shownSetup,
  onPresented,
  onDismiss,
}: PredictionsSetupSheetViewProps) {
  const { t } = useTranslation();

  return (
    <PendingResultSheetView
      isOpen={isOpen}
      contentKey={shownSetup?.key}
      title={shownSetup ? t(setupTitleKey(shownSetup.outcome)) : undefined}
      onPresented={onPresented}
      onDismiss={onDismiss}
      testID="predictions-setup-sheet"
    >
      {shownSetup ? <SetupContent outcome={shownSetup.outcome} onDismiss={onDismiss} /> : null}
    </PendingResultSheetView>
  );
}
