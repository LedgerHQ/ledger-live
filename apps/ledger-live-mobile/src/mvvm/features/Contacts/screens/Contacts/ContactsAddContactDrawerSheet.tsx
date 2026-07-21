import React from "react";
import {
  ContactsAddContactDrawer,
  type ContactsAddContactDrawerProps,
} from "@features/flow-contacts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";

export function ContactsAddContactDrawerSheet({
  isOpen,
  onClose,
  ...drawerProps
}: ContactsAddContactDrawerProps): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      testID="contacts-add-contact-drawer"
      enableDynamicSizing
    >
      <ContactsAddContactDrawer
        isOpen={isOpen}
        onClose={onClose}
        bottomInset={bottomInset}
        {...drawerProps}
      />
    </QueuedDrawerBottomSheet>
  );
}
