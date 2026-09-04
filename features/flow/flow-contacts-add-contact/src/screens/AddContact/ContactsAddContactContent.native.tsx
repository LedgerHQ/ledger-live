import React from "react";
import { Banner, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { ContactNameInput } from "@features/platform-contacts";
import type { ContactsAddContactContentNativeProps } from "./types";

export function ContactsAddContactContent({
  isConfirmEnabled,
  isSaving,
  draftName,
  invalidNameError,
  labels,
  autoFocus,
  onDraftNameChange,
  onConfirm,
}: ContactsAddContactContentNativeProps): React.JSX.Element {
  const nameValidationError =
    invalidNameError === null ? undefined : labels.nameValidationErrors[invalidNameError];

  return (
    <Box testID="contacts-add-contact-content" lx={{ gap: "s24" }}>
      <Box lx={{ gap: "s16" }}>
        <Text typography="heading3SemiBold" lx={{ color: "base" }}>
          {labels.title}
        </Text>
        <ContactNameInput
          value={draftName}
          placeholder={labels.namePlaceholder}
          errorMessage={nameValidationError}
          isEditable={!isSaving}
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
        loading={isSaving}
        onPress={onConfirm}
        testID="contacts-add-contact-save"
      >
        {labels.confirmName}
      </Button>
    </Box>
  );
}
