import React from "react";
import { Banner, Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { ContactNameInput } from "@features/platform-contacts";
import { useAddContactLabels } from "./copy/useAddContactLabels";
import type { ContactsAddContactContentNativeProps } from "./types";

export function ContactsAddContactContent({
  isSaving,
  draftName,
  invalidNameError,
  autoFocus,
  onDraftNameChange,
}: ContactsAddContactContentNativeProps): React.JSX.Element {
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
        <Banner appearance="info" description={labels.namingDisclaimer} />
      </Box>
    </Box>
  );
}
