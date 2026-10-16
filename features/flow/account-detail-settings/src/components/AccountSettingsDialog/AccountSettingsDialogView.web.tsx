import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import { AccountSettingsMenu } from "../AccountSettingsMenu";
import { ChangeNameContent } from "../ChangeNameContent/ChangeNameContent.web";
import { RemoveAccountContent } from "../RemoveAccountContent";
import type { AccountSettingsDialogViewProps } from "./types.web";

export function AccountSettingsDialogView({
  isOpen,
  accountName,
  nameMaxLength,
  isNameEditDisabled,
  step,
  title,
  changeNameTitle,
  changeNameDescription,
  onClose,
  onConfirmName,
  onViewAdvancedLogs,
  onConfirmRemove,
  onShowMenu,
  onShowChangeName,
  onShowRemove,
  testID,
}: AccountSettingsDialogViewProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-label={step === "changeName" ? changeNameTitle : title}
        aria-labelledby={undefined}
        aria-describedby={undefined}
        onCloseAutoFocus={onShowMenu}
        data-testid={testID}
      >
        <DialogBackgroundToneProvider>
          {step === "menu" && (
            <>
              <DialogHeader density="expanded" title={title} onClose={onClose} />
              <DialogBody>
                <AccountSettingsMenu
                  accountName={accountName}
                  onChangeName={onShowChangeName}
                  onViewAdvancedLogs={onViewAdvancedLogs}
                  onRemoveAccount={onShowRemove}
                />
              </DialogBody>
            </>
          )}
          {step === "changeName" && (
            <>
              <DialogHeader
                density="expanded"
                title={changeNameTitle}
                description={changeNameDescription}
                onBack={onShowMenu}
                onClose={onClose}
              />
              <DialogBody>
                <ChangeNameContent
                  initialName={accountName}
                  maxLength={nameMaxLength}
                  isDisabled={isNameEditDisabled}
                  onConfirm={onConfirmName}
                />
              </DialogBody>
            </>
          )}
          {step === "remove" && (
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
