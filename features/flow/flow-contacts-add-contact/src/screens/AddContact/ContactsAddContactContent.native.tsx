import React from "react";
import { Banner, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import { ContactNameInput } from "@features/platform-contacts";
import type { ContactsAddContactContentNativeProps } from "./types";

export function ContactsAddContactContent({
  isConfirmEnabled,
  isSaving,
  draftName,
  invalidNameError,
  autoFocus,
  onDraftNameChange,
  onConfirm,
}: ContactsAddContactContentNativeProps): React.JSX.Element {
  const { t } = useTranslation();
  const nameValidationErrors = {
    InvalidContactNameError: t("contacts.addContactDrawer.invalidNameError"),
    DuplicateContactNameError: t("contacts.addContactDrawer.duplicateNameError"),
  };
  const nameValidationError =
    invalidNameError === null ? undefined : nameValidationErrors[invalidNameError];

  return (
    <Box testID="contacts-add-contact-content" lx={{ gap: "s24" }}>
      <Box lx={{ gap: "s16" }}>
        <Text typography="heading3SemiBold" lx={{ color: "base" }}>
          {t("contacts.addContact")}
        </Text>
        <ContactNameInput
          value={draftName}
          placeholder={t("contacts.addContactDrawer.namePlaceholder")}
          errorMessage={nameValidationError}
          isEditable={!isSaving}
          autoFocus={autoFocus}
          onChangeText={onDraftNameChange}
        />
        <Banner appearance="info" description={t("contacts.addContactDrawer.namingDisclaimer")} />
      </Box>
      <Button
        appearance="base"
        size="lg"
        isFull
        disabled={!isConfirmEnabled}
        loading={isSaving}
        onPress={onConfirm}
        testID="contacts-add-contact-save"
      >
        {t("contacts.addContactDrawer.confirmName")}
      </Button>
    </Box>
  );
}
