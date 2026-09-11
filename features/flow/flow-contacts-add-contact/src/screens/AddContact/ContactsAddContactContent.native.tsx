import React from "react";
import { Banner, Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { ContactNameInput } from "@features/platform-contacts";
import type { ContactsAddContactContentNativeProps } from "./types";

export function ContactsAddContactContent({
  isSaving,
  draftName,
  invalidNameError,
  labels,
  autoFocus,
  onDraftNameChange,
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
    </Box>
  );
}
