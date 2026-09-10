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
import { useTranslation } from "@shared/i18n";
import type { ContactNameValidationErrorName } from "@domain/entity-contact";
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
  onDraftNameChange,
  onConfirm,
}: ContactsRenameContactDrawerProps): React.JSX.Element {
  const { t } = useTranslation();
  const nameValidationErrors: Record<ContactNameValidationErrorName, string> = {
    InvalidContactNameError: t("contacts.editContact.invalidNameError"),
    DuplicateContactNameError: t("contacts.addContactDrawer.duplicateNameError"),
  };
  const nameValidationError =
    invalidNameError === null ? undefined : nameValidationErrors[invalidNameError];

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 + keyboardInset }}>
      {isOpen ? (
        <Box testID="contacts-rename-contact-content" lx={{ gap: "s24" }}>
          <BottomSheetHeader />
          <Box lx={{ gap: "s16" }}>
            <Text typography="heading3SemiBold" lx={{ color: "base" }}>
              {t("contacts.editContact.title")}
            </Text>
            <ContactNameInput
              testIDPrefix="contacts-rename-contact"
              value={draftName}
              placeholder={t("contacts.editContact.namePlaceholder")}
              errorMessage={nameValidationError}
              autoFocus={autoFocus}
              onChangeText={onDraftNameChange}
            />
            <Banner appearance="info" description={t("contacts.editContact.namingDisclaimer")} />
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
            {t("contacts.editContact.confirmName")}
          </Button>
        </Box>
      ) : null}
    </BottomSheetView>
  );
}
