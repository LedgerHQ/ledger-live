import React from "react";
import {
  Banner,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Text,
  TextInput,
} from "@ledgerhq/lumen-ui-rnative";
import type { ContactsAddContactDrawerProps } from "../drawer.types";

const CONTACT_NAME_MAX_LENGTH = 32;

export function ContactsAddContactDrawer({
  isOpen,
  isConfirmEnabled,
  isSaving,
  draftName,
  bottomInset = 0,
  labels,
  onDraftNameChange,
  onConfirm,
}: ContactsAddContactDrawerProps): React.JSX.Element {
  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
      {isOpen ? (
        <Box lx={{ gap: "s24" }}>
          <BottomSheetHeader />
          <Box lx={{ gap: "s16", paddingHorizontal: "s16" }}>
            <Text typography="heading3SemiBold" lx={{ color: "base" }}>
              {labels.title}
            </Text>
            <TextInput
              testID="contacts-add-contact-name-input"
              autoFocus
              placeholder={labels.namePlaceholder}
              value={draftName}
              onChangeText={name => onDraftNameChange(name.slice(0, CONTACT_NAME_MAX_LENGTH))}
              maxLength={CONTACT_NAME_MAX_LENGTH}
              maxCount={CONTACT_NAME_MAX_LENGTH}
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
          >
            {labels.confirmName}
          </Button>
        </Box>
      ) : null}
    </BottomSheetView>
  );
}
