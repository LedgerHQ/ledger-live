import React, { useEffect, useRef } from "react";
import type { TextInput as NativeTextInput } from "react-native";
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
import {
  CONTACTS_NATIVE_ADDRESS_INPUT_PROPS,
  CONTACTS_NATIVE_NAME_INPUT_PROPS,
} from "@features/platform-contacts";
import { useBottomSheetKeyboardAwareInput } from "@shared/ui-queued-bottom-sheet/keyboard";
import type { ContactsRenameAddressDrawerProps } from "./types";
import { useEditAddressAddressEntryPresentation } from "./useEditAddressAddressEntryPresentation.native";

export function ContactsRenameAddressDialog({
  isOpen,
  isConfirmEnabled,
  isSaving,
  draftLabel,
  invalidLabelError,
  isDeviceRequired,
  autoFocus = false,
  bottomInset = 0,
  labels,
  onDraftLabelChange,
  onAddressChange,
  onConfirm,
  addressEntry,
}: ContactsRenameAddressDrawerProps): React.JSX.Element {
  const addressInputRef = useRef<NativeTextInput>(null);
  const labelInputRef = useRef<NativeTextInput>(null);
  // Registers both fields with the sheet, so it knows the keyboard is up and the sheet closing
  // behind it does not retract a keyboard this one raised.
  const addressInputProps = useBottomSheetKeyboardAwareInput(addressInputRef);
  const labelInputProps = useBottomSheetKeyboardAwareInput(labelInputRef);

  useEffect(() => {
    if (autoFocus) {
      addressInputRef.current?.focus();
    }
  }, [autoFocus]);

  const labelValidationError =
    invalidLabelError === null ? undefined : labels.labelValidationErrors[invalidLabelError];
  const addressInput = useEditAddressAddressEntryPresentation({
    addressEntry,
    labels: labels.addressValidation,
    onAddressChange,
  });

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
      {isOpen ? (
        <Box lx={{ gap: "s24" }}>
          <BottomSheetHeader density="expanded" title={labels.title} />
          <Box lx={{ gap: "s24", paddingHorizontal: "s16" }}>
            <TextInput
              ref={addressInputRef}
              testID="contacts-edit-address-input"
              value={addressInput.value}
              placeholder={labels.addressValidation.addressPlaceholder}
              onChangeText={addressInput.onChangeText}
              status={addressInput.inputStatus}
              helperText={addressInput.helperText}
              {...CONTACTS_NATIVE_ADDRESS_INPUT_PROPS}
              {...addressInputProps}
            />
            {addressInput.showEnsDisclaimer ? (
              <Banner
                testID="contacts-edit-address-ens-disclaimer"
                appearance="info"
                title={labels.addressValidation.ensDisclaimer}
                description={labels.addressValidation.ensDisclaimerDescription}
              />
            ) : null}
            <TextInput
              {...CONTACTS_NATIVE_NAME_INPUT_PROPS}
              ref={labelInputRef}
              helperText={labelValidationError}
              label={labels.inputLabel}
              maxLength={CONTACT_ADDRESS_LABEL_MAX_LENGTH}
              onChangeText={onDraftLabelChange}
              status={labelValidationError ? "error" : undefined}
              testID="contacts-rename-address-input"
              value={draftLabel}
              {...labelInputProps}
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
