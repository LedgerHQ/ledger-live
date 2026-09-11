import React from "react";
import { ContactNameInput } from "@features/platform-contacts";
import { Banner, BottomSheetHeader, BottomSheetView, Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { ContactsRenameContactDrawerProps } from "./types";

export function ContactsRenameContactDrawer({
  isOpen,
  draftName,
  invalidNameError,
  autoFocus = false,
  bottomInset = 0,
  labels,
  onDraftNameChange,
}: ContactsRenameContactDrawerProps): React.JSX.Element {
  const nameValidationError =
    invalidNameError === null ? undefined : labels.nameValidationErrors[invalidNameError];

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset }}>
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
        </Box>
      ) : null}
    </BottomSheetView>
  );
}
