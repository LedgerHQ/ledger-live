import React from "react";
import {
  Banner,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  TextInput,
} from "@ledgerhq/lumen-ui-rnative";
import { LedgerLogo } from "@ledgerhq/lumen-ui-rnative/symbols";
import {
  CONTACT_ADDRESS_LABEL_MAX_LENGTH,
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  type ContactAddressLabelValidationErrorName,
} from "@domain/entity-contact";
import { CONTACTS_NATIVE_ADDRESS_INPUT_PROPS } from "@features/platform-contacts";
import { useTranslation } from "@shared/i18n";
import type { ContactsRenameAddressDrawerProps } from "./types";
import { useEditAddressAddressEntryPresentation } from "./useEditAddressAddressEntryPresentation.native";

export function ContactsRenameAddressDialog({
  isOpen,
  isConfirmEnabled,
  isSaving,
  draftLabel,
  invalidLabelError,
  isDeviceRequired,
  bottomInset = 0,
  keyboardInset = 0,
  onDraftLabelChange,
  onAddressChange,
  onConfirm,
  addressEntry,
}: ContactsRenameAddressDrawerProps): React.JSX.Element {
  const { t } = useTranslation();
  const labelValidationErrors: Record<ContactAddressLabelValidationErrorName, string> = {
    [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.editAddress.invalidLabelError"),
    [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.addAddressName.duplicateLabel"),
    [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]: t("contacts.addAddressName.labelTooLong"),
  };
  const labelValidationError =
    invalidLabelError === null ? undefined : labelValidationErrors[invalidLabelError];
  const addressInput = useEditAddressAddressEntryPresentation({
    addressEntry,
    onAddressChange,
  });

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 + keyboardInset }}>
      {isOpen ? (
        <Box lx={{ gap: "s24" }}>
          <BottomSheetHeader density="expanded" title={t("contacts.editAddress.title")} />
          <Box lx={{ gap: "s24", paddingHorizontal: "s16" }}>
            <TextInput
              testID="contacts-edit-address-input"
              value={addressInput.value}
              placeholder={t("contacts.addAddressEntry.addressPlaceholder")}
              onChangeText={addressInput.onChangeText}
              status={addressInput.inputStatus}
              helperText={addressInput.helperText}
              {...CONTACTS_NATIVE_ADDRESS_INPUT_PROPS}
            />
            {addressInput.showEnsDisclaimer ? (
              <Banner
                testID="contacts-edit-address-ens-disclaimer"
                appearance="info"
                title={t("contacts.addAddressEntry.ensDisclaimer")}
                description={t("contacts.addAddressEntry.ensDisclaimerDescription")}
              />
            ) : null}
            <TextInput
              {...CONTACTS_NATIVE_ADDRESS_INPUT_PROPS}
              helperText={labelValidationError}
              label={t("contacts.editAddress.inputLabel")}
              maxLength={CONTACT_ADDRESS_LABEL_MAX_LENGTH}
              onChangeText={onDraftLabelChange}
              status={labelValidationError ? "error" : undefined}
              testID="contacts-rename-address-input"
              value={draftLabel}
            />
            <Button
              appearance="base"
              size="lg"
              isFull
              disabled={!isConfirmEnabled}
              icon={isDeviceRequired ? LedgerLogo : undefined}
              loading={isSaving}
              onPress={() => void onConfirm()}
              testID="contacts-rename-address-confirm"
            >
              {t("contacts.editAddress.applyChanges")}
            </Button>
          </Box>
        </Box>
      ) : null}
    </BottomSheetView>
  );
}
