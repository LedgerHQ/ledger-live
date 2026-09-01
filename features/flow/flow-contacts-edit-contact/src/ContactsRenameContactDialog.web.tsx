import React from "react";
import { Button, Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import { ContactNameDisclaimer, ContactNameInput } from "@features/platform-contacts";
import type { ContactsRenameContactDialogProps } from "./types";

const NAMING_DISCLAIMER_ID = "contacts-rename-contact-naming-disclaimer";

export function ContactsRenameContactDialog({
  isOpen,
  isConfirmEnabled,
  isSaving,
  draftName,
  invalidNameError,
  isDeviceRequired,
  labels,
  onClose,
  onDraftNameChange,
  onConfirm,
}: ContactsRenameContactDialogProps): React.ReactNode {
  const nameValidationError =
    invalidNameError === null ? undefined : labels.nameValidationErrors[invalidNameError];

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-describedby={NAMING_DISCLAIMER_ID}
        className="w-[400px] bg-canvas-sheet pb-24"
        data-testid="contacts-rename-contact-dialog"
      >
        <DialogHeader density="expanded" title={labels.title} onClose={onClose} />
        <DialogBody className="flex flex-col gap-32 px-24 pb-24">
          <div className="flex flex-col gap-24">
            <ContactNameInput
              testIDPrefix="contacts-rename-contact"
              value={draftName}
              placeholder={labels.namePlaceholder}
              errorMessage={nameValidationError}
              onChange={onDraftNameChange}
            />
            <ContactNameDisclaimer
              disclaimerId={NAMING_DISCLAIMER_ID}
              text={labels.namingDisclaimer}
            />
          </div>
          <Button
            appearance="base"
            size="lg"
            className="w-full"
            disabled={!isConfirmEnabled}
            icon={isDeviceRequired ? LedgerLogo : undefined}
            loading={isSaving}
            onClick={() => void onConfirm()}
            data-testid="contacts-rename-contact-confirm"
          >
            {labels.applyChanges}
          </Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
