import React from "react";
import {
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  TextInput,
} from "@ledgerhq/lumen-ui-rnative";
import { CONTACT_ADDRESS_LABEL_MAX_LENGTH } from "@domain/entity-contact";
import type { ContactsRenameAddressDrawerProps } from "./types";

export function ContactsRenameAddressDialog({
  isOpen,
  isConfirmEnabled,
  isSaving,
  draftLabel,
  invalidLabelError,
  bottomInset = 0,
  labels,
  onDraftLabelChange,
  onConfirm,
}: ContactsRenameAddressDrawerProps): React.JSX.Element {
  const labelValidationError =
    invalidLabelError === null ? undefined : labels.labelValidationErrors[invalidLabelError];

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
      {isOpen ? (
        <Box lx={{ gap: "s24" }}>
          <BottomSheetHeader density="expanded" title={labels.title} />
          <Box lx={{ gap: "s24", paddingHorizontal: "s16" }}>
            <TextInput
              autoComplete="off"
              autoCorrect={false}
              helperText={labelValidationError}
              label={labels.inputLabel}
              maxLength={CONTACT_ADDRESS_LABEL_MAX_LENGTH}
              onChangeText={onDraftLabelChange}
              status={labelValidationError ? "error" : undefined}
              value={draftLabel}
            />
            <Button
              appearance="base"
              size="lg"
              isFull
              disabled={!isConfirmEnabled}
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
