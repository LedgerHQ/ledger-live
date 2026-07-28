import React from "react";
import { Platform } from "react-native";
import {
  ContactsAddAddressEntryView,
  type ContactsAddAddressEntryViewProps,
} from "@features/flow-contacts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { shouldUseKeyboardAvoidance, useKeyboardVisible } from "~/logic/keyboardVisible";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";

type ContactsAddAddressEntryDrawerSheetProps = Readonly<{
  isOpen: boolean;
  entryProps: ContactsAddAddressEntryViewProps | null;
  onBack: () => void;
}>;

export function ContactsAddAddressEntryDrawerSheet({
  isOpen,
  entryProps,
  onBack,
}: ContactsAddAddressEntryDrawerSheetProps): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { keyboardHeight } = useKeyboardVisible({
    eventTiming: Platform.OS === "ios" ? "will" : "did",
  });
  const keyboardInset = shouldUseKeyboardAvoidance(Platform.OS, Platform.Version)
    ? keyboardHeight
    : 0;

  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isOpen}
      onBack={onBack}
      testID="contacts-add-address-entry-drawer"
      snapPoints={["100%"]}
      hasBackButton
      noCloseButton
      hideHandle
      preventBackdropClick
      enablePanDownToClose={false}
    >
      {entryProps ? (
        <ContactsAddAddressEntryView
          {...entryProps}
          bottomInset={bottomInset}
          keyboardInset={keyboardInset}
        />
      ) : null}
    </QueuedDrawerBottomSheet>
  );
}
