import React from "react";
import { Platform } from "react-native";
import {
  ContactsAddContactDrawer,
  type ContactsAddContactDrawerProps,
} from "@features/flow-contacts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { shouldUseKeyboardAvoidance, useKeyboardVisible } from "~/logic/keyboardVisible";
import QueuedBottomSheet from "LLM/components/QueuedDrawer/QueuedBottomSheet";

export function ContactsAddContactDrawerSheet({
  isOpen,
  onClose,
  ...drawerProps
}: ContactsAddContactDrawerProps): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { keyboardHeight } = useKeyboardVisible({
    eventTiming: Platform.OS === "ios" ? "will" : "did",
  });
  const keyboardInset = shouldUseKeyboardAvoidance(Platform.OS, Platform.Version)
    ? keyboardHeight
    : 0;

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      testID="contacts-add-contact-drawer"
      enableDynamicSizing
    >
      <ContactsAddContactDrawer
        isOpen={isOpen}
        onClose={onClose}
        bottomInset={bottomInset}
        keyboardInset={keyboardInset}
        {...drawerProps}
      />
    </QueuedBottomSheet>
  );
}
