import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { InfoState } from "@shared/ui-info-state";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
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
  const onOpenChange = (open: boolean) => {
    if (!open && !isConfirming) onCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} height="fit">
      <DialogContent aria-describedby={undefined} data-testid={testID}>
        <DialogBackgroundToneProvider>
          <DialogHeader density="compact" onClose={isConfirming ? undefined : onCancel} />
          <DialogBody>
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
          </DialogBody>
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}
