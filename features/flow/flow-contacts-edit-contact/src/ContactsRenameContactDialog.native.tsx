import React from "react";
import { ContactNameDisclaimer, ContactNameInput } from "@features/platform-contacts";
import { BottomSheetHeader, BottomSheetView, Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useBottomSheetFooterInset } from "@shared/ui-queued-bottom-sheet";
import { useEditContactLabels } from "./copy/useEditContactLabels";
import type { ContactsRenameContactDialogProps } from "./ContactsRenameContactDialog.types";

export function ContactsRenameContactDialog({
  isOpen,
  draftName,
  invalidNameError,
  autoFocus = false,
  onDraftNameChange,
}: ContactsRenameContactDialogProps): React.JSX.Element {
  const labels = useEditContactLabels();
  const footerInset = useBottomSheetFooterInset();
  const nameValidationError =
    invalidNameError === null ? undefined : labels.nameValidationErrors[invalidNameError];

  return (
    <BottomSheetView style={{ paddingBottom: footerInset }}>
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
              onChangeName={onDraftNameChange}
            />
            <ContactNameDisclaimer text={labels.namingDisclaimer} />
          </Box>
        </Box>
      ) : null}
    </BottomSheetView>
  );
}
