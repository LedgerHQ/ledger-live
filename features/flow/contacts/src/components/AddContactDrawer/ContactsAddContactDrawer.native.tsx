import React from "react";
import {
  Banner,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { ContactNameInput } from "./ContactNameInput";
import type { ContactsAddContactDrawerProps } from "./types";

export function ContactsAddContactDrawer({
  isOpen,
  isConfirmEnabled,
  isSaving,
  draftName,
  invalidNameError,
  bottomInset = 0,
  keyboardInset = 0,
  labels,
  onDraftNameChange,
  onConfirm,
}: ContactsAddContactDrawerProps): React.JSX.Element {
  const nameValidationError =
    invalidNameError === null ? undefined : labels.nameValidationErrors[invalidNameError];
  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 + keyboardInset }}>
      {isOpen ? (
        <Box lx={{ gap: "s24" }}>
          <BottomSheetHeader />
          <Box lx={{ gap: "s16", paddingHorizontal: "s16" }}>
            <Text typography="heading3SemiBold" lx={{ color: "base" }}>
              {labels.title}
            </Text>
            <ContactNameInput
              value={draftName}
              placeholder={labels.namePlaceholder}
              errorMessage={nameValidationError}
              onChangeText={onDraftNameChange}
            />
            <Banner appearance="info" description={labels.namingDisclaimer} />
          </Box>
          <Button
            appearance="base"
            size="lg"
            isFull
            disabled={!isConfirmEnabled}
            loading={isSaving}
            onPress={onConfirm}
          >
            {labels.confirmName}
          </Button>
        </Box>
      ) : null}
    </BottomSheetView>
  );
}
