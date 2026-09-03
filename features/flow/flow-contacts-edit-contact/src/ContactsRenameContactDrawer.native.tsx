import React from "react";
import { ContactNameInput } from "@features/platform-contacts";
import {
  Banner,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { LedgerLogo } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { ContactsRenameContactDrawerProps } from "./types";

export function ContactsRenameContactDrawer({
  isOpen,
  isConfirmEnabled,
  isSaving,
  draftName,
  invalidNameError,
  isDeviceRequired,
  bottomInset = 0,
  keyboardInset = 0,
  autoFocus = false,
  labels,
  onDraftNameChange,
  onConfirm,
}: ContactsRenameContactDrawerProps): React.JSX.Element {
  const nameValidationError =
    invalidNameError === null ? undefined : labels.nameValidationErrors[invalidNameError];

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 + keyboardInset }}>
      {isOpen ? (
        <Box testID="contacts-rename-contact-content" lx={{ gap: "s24" }}>
          <BottomSheetHeader />
          <Box lx={{ gap: "s16" }}>
            <Text typography="heading3SemiBold" lx={{ color: "base" }}>
              {labels.title}
            </Text>
            <ContactNameInput
              testIDPrefix="contacts-rename-contact"
              value={draftName}
              placeholder={labels.namePlaceholder}
              errorMessage={nameValidationError}
              autoFocus={autoFocus}
              onChangeText={onDraftNameChange}
            />
            <Banner appearance="info" description={labels.namingDisclaimer} />
          </Box>
          <Button
            appearance="base"
            size="lg"
            isFull
            disabled={!isConfirmEnabled}
            icon={isDeviceRequired ? LedgerLogo : undefined}
            loading={isSaving}
            onPress={() => void onConfirm()}
            testID="contacts-rename-contact-confirm"
          >
            {labels.confirmName}
          </Button>
        </Box>
      ) : null}
    </BottomSheetView>
  );
}
