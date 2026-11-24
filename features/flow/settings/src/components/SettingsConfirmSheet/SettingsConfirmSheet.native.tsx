import React from "react";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
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
      testID={testID}
    >
      <Box lx={{ gap: "s8" }}>
        <Button
          appearance={tone === "destructive" ? "red" : "base"}
          size="lg"
          isFull
          loading={isConfirming}
          disabled={isConfirming}
          onPress={onConfirm}
          testID={confirmTestID}
        >
          {labels.confirm}
        </Button>
        <Button
          appearance="gray"
          size="lg"
          isFull
          disabled={isConfirming}
          onPress={onCancel}
          testID={cancelTestID}
        >
          {labels.cancel}
        </Button>
      </Box>
    </SettingsSheet>
  );
}
