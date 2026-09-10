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
import { LedgerLogo } from "@ledgerhq/lumen-ui-react/symbols";
import {
  CONTACT_ADDRESS_LABEL_MAX_LENGTH,
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  type ContactAddressLabelValidationErrorName,
} from "@domain/entity-contact";
import { useTranslation } from "@shared/i18n";
import type { ContactsRenameAddressDialogProps } from "./types";
import { useEditAddressDialogPresentation } from "./useEditAddressDialogPresentation.web";

export function ContactsRenameAddressDialog({
  isOpen,
  isConfirmEnabled,
  isSaving,
  draftLabel,
  invalidLabelError,
  addressEntry,
  isDeviceRequired,
  onClose,
  onDraftLabelChange,
  onAddressChange,
  onConfirm,
}: ContactsRenameAddressDialogProps): React.ReactNode {
  const { t } = useTranslation();
  const labelValidationErrors: Record<ContactAddressLabelValidationErrorName, string> = {
    [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.editAddress.invalidLabelError"),
    [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.addAddressName.duplicateLabel"),
    [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]: t("contacts.addAddressName.tooLongLabel"),
  };
  const labelValidationError =
    invalidLabelError === null ? undefined : labelValidationErrors[invalidLabelError];
  const addressInput = useEditAddressDialogPresentation({
    addressEntry,
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
        <DialogHeader
          density="expanded"
          title={t("contacts.editAddress.title")}
          onClose={onClose}
        />
        <DialogBody className="flex flex-col gap-32 px-24 pt-2 pb-24">
          <AddressInput
            autoComplete="off"
            autoCorrect="off"
            data-testid="contacts-edit-address-input"
            helperText={addressInput.helperText}
            onChange={addressInput.onChange}
            onPaste={addressInput.onPaste}
            placeholder={t("contacts.addAddressEntry.addressPlaceholder")}
            prefix=""
            spellCheck={false}
            status={addressInput.inputStatus}
            value={addressInput.value}
          />
          {addressInput.showEnsDisclaimer ? (
            <Banner
              appearance="info"
              data-testid="contacts-edit-address-ens-disclaimer"
              title={t("contacts.addAddressEntry.ensDisclaimer")}
              description={t("contacts.addAddressEntry.ensDisclaimerDescription")}
            />
          ) : null}
          <TextInput
            autoComplete="off"
            autoCorrect="off"
            data-testid="contacts-rename-address-input"
            helperText={labelValidationError}
            label={t("contacts.editAddress.inputLabel")}
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
            icon={isDeviceRequired ? LedgerLogo : undefined}
            loading={isSaving}
            onClick={() => void onConfirm()}
            data-testid="contacts-rename-address-confirm"
          >
            {t("contacts.editAddress.applyChanges")}
          </Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
