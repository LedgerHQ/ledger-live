import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import { AccountSettingsMenu } from "../AccountSettingsMenu";
import { RemoveAccountContent } from "../RemoveAccountContent";
import type { AccountSettingsDialogViewProps } from "./types.web";

export function AccountSettingsDialogView({
  isOpen,
  accountName,
  step,
  title,
  onClose,
  onChangeName,
  onViewAdvancedLogs,
  onConfirmRemove,
  onShowMenu,
  onShowRemove,
  testID,
}: AccountSettingsDialogViewProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-label={title}
        aria-labelledby={undefined}
        aria-describedby={undefined}
        onCloseAutoFocus={onShowMenu}
        data-testid={testID}
      >
        <DialogBackgroundToneProvider>
          {step === "menu" ? (
            <>
              <DialogHeader density="expanded" title={title} onClose={onClose} />
              <DialogBody>
                <AccountSettingsMenu
                  accountName={accountName}
                  onChangeName={onChangeName}
                  onViewAdvancedLogs={onViewAdvancedLogs}
                  onRemoveAccount={onShowRemove}
                />
              </DialogBody>
            </>
          ) : (
            <>
              <DialogHeader density="compact" onBack={onShowMenu} onClose={onClose} />
              <DialogBody>
                <RemoveAccountContent onConfirm={onConfirmRemove} onCancel={onClose} />
              </DialogBody>
            </>
          )}
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}
