import React from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import { CONTACT_NAME_MAX_LENGTH } from "./model/constants";
import { ContactsAddContactNamingDisclaimer } from "./ContactsAddContactNamingDisclaimer.web";
import type { ContactsAddContactDialogProps } from "./types";

const NAMING_DISCLAIMER_ID = "contacts-add-contact-naming-disclaimer";

export function ContactsAddContactDialog({
  isOpen,
  isConfirmEnabled,
  isSaving,
  draftName,
  labels,
  onClose,
  onDraftNameChange,
  onConfirm,
}: ContactsAddContactDialogProps): React.ReactNode {
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
        data-testid="contacts-add-contact-dialog"
      >
        <DialogHeader
          density="expanded"
          title={labels.title}
          onClose={onClose}
        />
        <DialogBody className="flex flex-col gap-24 px-24 pb-24 pt-12">
          <div className="flex flex-col gap-8">
            <TextInput
              data-testid="contacts-add-contact-name-input"
              placeholder={labels.namePlaceholder}
              value={draftName}
              onChange={(event) =>
                onDraftNameChange(
                  event.target.value.slice(0, CONTACT_NAME_MAX_LENGTH),
                )
              }
              maxLength={CONTACT_NAME_MAX_LENGTH}
            />
            <p
              className="body-3 self-end text-muted"
              data-testid="contacts-add-contact-name-count"
            >
              {`${draftName.length}/${CONTACT_NAME_MAX_LENGTH}`}
            </p>
          </div>
          <ContactsAddContactNamingDisclaimer
            disclaimerId={NAMING_DISCLAIMER_ID}
            text={labels.namingDisclaimer}
          />
          <Button
            appearance="base"
            size="lg"
            className="w-full"
            disabled={!isConfirmEnabled}
            loading={isSaving}
            onClick={() => void onConfirm()}
            data-testid="contacts-add-contact-save"
          >
            {labels.confirmName}
          </Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
