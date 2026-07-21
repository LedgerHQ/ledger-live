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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import type { ContactsAddContactDrawerViewModel } from "./types";

const CONTACT_NAME_MAX_LENGTH = 32;

export function ContactsAddContactDrawer({
  isOpen,
  isConfirmEnabled,
  isSaving,
  draftName,
  labels,
  onClose,
  onDraftNameChange,
  onConfirm,
}: ContactsAddContactDrawerViewModel): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      testID="contacts-add-contact-drawer"
      enableDynamicSizing
    >
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
    </QueuedDrawerBottomSheet>
  );
}
