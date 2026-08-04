import type { ContactNameValidationErrorName } from "@domain/entity-contact";
import React from "react";
import {
  Banner,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { ContactNameInput } from "../../steps/AddContact/components/ContactNameInput";

export type ContactsContactNameDrawerLabels = Readonly<{
  title: string;
  namePlaceholder: string;
  namingDisclaimer: string;
  nameValidationErrors: Readonly<Record<ContactNameValidationErrorName, string>>;
}>;

export type ContactsContactNameDrawerContentProps = Readonly<{
  isOpen: boolean;
  isConfirmEnabled: boolean;
  isSaving: boolean;
  draftName: string;
  invalidNameError: ContactNameValidationErrorName | null;
  bottomInset?: number;
  keyboardInset?: number;
  labels: ContactsContactNameDrawerLabels;
  confirmLabel: string;
  confirmTestID?: string;
  onDraftNameChange: (name: string) => void;
  onConfirm: () => Promise<void>;
}>;

export function ContactsContactNameDrawerContent({
  isOpen,
  isConfirmEnabled,
  isSaving,
  draftName,
  invalidNameError,
  bottomInset = 0,
  keyboardInset = 0,
  labels,
  confirmLabel,
  confirmTestID,
  onDraftNameChange,
  onConfirm,
}: ContactsContactNameDrawerContentProps): React.JSX.Element {
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
            testID={confirmTestID}
          >
            {confirmLabel}
          </Button>
        </Box>
      ) : null}
    </BottomSheetView>
  );
}
