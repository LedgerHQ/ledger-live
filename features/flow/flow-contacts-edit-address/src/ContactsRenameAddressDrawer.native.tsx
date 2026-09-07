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
import { CONTACT_ADDRESS_LABEL_MAX_LENGTH } from "@domain/entity-contact";
import { CONTACTS_NATIVE_ADDRESS_INPUT_PROPS } from "@features/platform-contacts";
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
  labels,
  onDraftLabelChange,
  onAddressChange,
  onConfirm,
  addressEntry,
}: ContactsRenameAddressDrawerProps): React.JSX.Element {
  const labelValidationError =
    invalidLabelError === null ? undefined : labels.labelValidationErrors[invalidLabelError];
  const addressInput = useEditAddressAddressEntryPresentation({
    addressEntry,
    labels: labels.addressValidation,
    onAddressChange,
  });

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 + keyboardInset }}>
      {isOpen ? (
        <Box lx={{ gap: "s24" }}>
          <BottomSheetHeader density="expanded" title={labels.title} />
          <Box lx={{ gap: "s24", paddingHorizontal: "s16" }}>
            <TextInput
              testID="contacts-edit-address-input"
              value={addressInput.value}
              placeholder={labels.addressValidation.addressPlaceholder}
              onChangeText={addressInput.onChangeText}
              status={addressInput.inputStatus}
              helperText={addressInput.helperText}
              {...CONTACTS_NATIVE_ADDRESS_INPUT_PROPS}
            />
            {addressInput.showEnsDisclaimer ? (
              <Banner
                testID="contacts-edit-address-ens-disclaimer"
                appearance="info"
                description={labels.addressValidation.ensDisclaimer}
              />
            ) : null}
            <TextInput
              {...CONTACTS_NATIVE_ADDRESS_INPUT_PROPS}
              helperText={labelValidationError}
              label={labels.inputLabel}
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
              {labels.applyChanges}
            </Button>
          </Box>
        </Box>
      ) : null}
    </BottomSheetView>
  );
}
