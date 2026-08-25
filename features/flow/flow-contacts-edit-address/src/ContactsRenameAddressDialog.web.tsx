import React from "react";
import {
  AddressInput,
  Banner,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  TextInput,
} from "@ledgerhq/lumen-ui-react";
import { CONTACT_ADDRESS_LABEL_MAX_LENGTH } from "@domain/entity-contact";
import type { ContactsRenameAddressDialogProps } from "./types";
import { useEditAddressDialogPresentation } from "./useEditAddressDialogPresentation.web";

export function ContactsRenameAddressDialog({
  isOpen,
  isConfirmEnabled,
  isSaving,
  draftLabel,
  invalidLabelError,
  addressEntry,
  labels,
  onClose,
  onDraftLabelChange,
  onAddressChange,
  onConfirm,
}: ContactsRenameAddressDialogProps): React.ReactNode {
  const labelValidationError =
    invalidLabelError === null ? undefined : labels.labelValidationErrors[invalidLabelError];
  const addressInput = useEditAddressDialogPresentation({
    addressEntry,
    labels: labels.addressValidation,
    onAddressChange,
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[400px] bg-canvas-sheet pb-24"
        data-testid="contacts-rename-address-dialog"
      >
        <DialogHeader density="expanded" title={labels.title} onClose={onClose} />
        <DialogBody className="flex flex-col gap-32 px-24 pt-2 pb-24">
          <AddressInput
            autoComplete="off"
            autoCorrect="off"
            data-testid="contacts-edit-address-input"
            helperText={addressInput.helperText}
            onChange={addressInput.onChange}
            onPaste={addressInput.onPaste}
            placeholder={labels.addressValidation.addressPlaceholder}
            prefix=""
            spellCheck={false}
            status={addressInput.inputStatus}
            value={addressInput.value}
          />
          {addressInput.showEnsDisclaimer ? (
            <Banner
              appearance="info"
              data-testid="contacts-edit-address-ens-disclaimer"
              description={labels.addressValidation.ensDisclaimer}
            />
          ) : null}
          <TextInput
            autoComplete="off"
            autoCorrect="off"
            data-testid="contacts-rename-address-input"
            helperText={labelValidationError}
            label={labels.inputLabel}
            maxCount={CONTACT_ADDRESS_LABEL_MAX_LENGTH}
            maxLength={CONTACT_ADDRESS_LABEL_MAX_LENGTH}
            onChange={event => onDraftLabelChange(event.target.value)}
            spellCheck={false}
            status={labelValidationError ? "error" : undefined}
            value={draftLabel}
          />
          <Button
            appearance="base"
            size="lg"
            className="w-full"
            disabled={!isConfirmEnabled}
            loading={isSaving}
            onClick={() => void onConfirm()}
            data-testid="contacts-rename-address-confirm"
          >
            {labels.applyChanges}
          </Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
