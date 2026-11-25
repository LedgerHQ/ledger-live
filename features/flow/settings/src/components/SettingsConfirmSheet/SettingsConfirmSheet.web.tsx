import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { SettingsSheet } from "../SettingsSheet/SettingsSheet";
import type { SettingsConfirmSheetProps } from "./SettingsConfirmSheet.types";

export function SettingsConfirmSheet({
  isOpen,
  tone,
  labels,
  isConfirming = false,
  onConfirm,
  onCancel,
  testID,
  confirmTestID,
  cancelTestID,
}: SettingsConfirmSheetProps) {
  return (
    <SettingsSheet
      isOpen={isOpen}
      title={labels.title}
      description={labels.description}
      onClose={onCancel}
      canClose={!isConfirming}
      testID={testID}
    >
      <div className="flex w-full gap-16">
        <Button
          appearance="gray"
          size="lg"
          isFull
          onClick={onCancel}
          disabled={isConfirming}
          data-testid={cancelTestID}
        >
          {labels.cancel}
        </Button>
        <Button
          appearance={tone === "destructive" ? "red" : "base"}
          size="lg"
          isFull
          loading={isConfirming}
          disabled={isConfirming}
          onClick={onConfirm}
          data-testid={confirmTestID}
        >
          {labels.confirm}
        </Button>
      </div>
    </SettingsSheet>
  );
}
