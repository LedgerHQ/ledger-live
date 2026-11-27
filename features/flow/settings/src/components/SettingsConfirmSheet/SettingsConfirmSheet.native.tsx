import React from "react";
import { BottomSheetHeader } from "@ledgerhq/lumen-ui-rnative";
import { InfoState } from "@shared/ui-info-state";
import { SettingsBottomSheet } from "../SettingsSheet/SettingsBottomSheet";
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
    <SettingsBottomSheet
      isOpen={isOpen}
      onClose={onCancel}
      canClose={!isConfirming}
      testID={testID}
    >
      <BottomSheetHeader testID={testID && `${testID}-header`} />
      <InfoState
        preset={tone === "destructive" ? "error" : "info"}
        size="hug"
        title={labels.title}
        description={labels.description}
        primaryCta={{
          label: labels.confirm,
          onPress: onConfirm,
          testID: confirmTestID,
          loading: isConfirming,
          disabled: isConfirming,
        }}
        secondaryCta={{
          label: labels.cancel,
          onPress: onCancel,
          testID: cancelTestID,
          disabled: isConfirming,
        }}
      />
    </SettingsBottomSheet>
  );
}
