import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { ContactNameDisclaimer, ContactNameInput } from "@features/platform-contacts";
import { useAddContactLabels } from "./copy/useAddContactLabels";
import type { ContactsAddContactContentProps } from "./ContactsAddContactContent.types";

export function ContactsAddContactContent({
  isSaving,
  draftName,
  invalidNameError,
  autoFocus,
  onDraftNameChange,
}: ContactsAddContactContentProps): React.JSX.Element {
  const labels = useAddContactLabels();
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
          onChangeName={onDraftNameChange}
        />
        <ContactNameDisclaimer text={labels.namingDisclaimer} />
      </Box>
    </Box>
  );
}
