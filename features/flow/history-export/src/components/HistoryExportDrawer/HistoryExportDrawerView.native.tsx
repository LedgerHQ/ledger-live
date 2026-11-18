import React, { useCallback } from "react";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import type { HistoryExportViewModel } from "../../useHistoryExportViewModel";
import { ExportResultScene } from "./internals/ExportResultScene";
import { ExportScene } from "./internals/ExportScene";

type HistoryExportDrawerViewProps = HistoryExportViewModel & Readonly<{ onClose: () => void }>;

export function HistoryExportDrawerView({
  success,
  error,
  resetState,
  onDoneClick,
  onClose,
  ...selection
}: HistoryExportDrawerViewProps) {
  const { t } = useTranslation();

  const handleDone = useCallback(() => {
    onDoneClick();
    onClose();
  }, [onClose, onDoneClick]);

  const footer =
    success || error ? null : (
      <Button
        appearance="base"
        size="lg"
        isFull
        disabled={selection.disabled || selection.isLoading}
        loading={selection.isLoading}
        onPress={() => void selection.exportCsv()}
        testID="history-export-csv-confirm"
      >
        {t("history.exportDialog.export")}
      </Button>
    );

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened
      onClose={onClose}
      enableDynamicSizing
      maxDynamicContentSize="fullWithOffset"
      footer={footer}
      testID="history-export-drawer"
    >
      {success ? <ExportResultScene variant="success" onButtonClick={handleDone} /> : null}
      {error ? <ExportResultScene variant="error" onButtonClick={resetState} /> : null}
      {success || error ? null : <ExportScene {...selection} />}
    </QueuedBottomSheet>
  );
}
