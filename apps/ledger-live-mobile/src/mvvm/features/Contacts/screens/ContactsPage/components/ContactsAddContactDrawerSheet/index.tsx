import React from "react";
import { Platform } from "react-native";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { ContactsAddContactContent } from "@features/flow-contacts-add-contact";
import type { AddContactAppAdapterResult } from "@features/flow-contacts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { shouldUseKeyboardAvoidance, useKeyboardVisible } from "~/logic/keyboardVisible";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";

export function ContactsAddContactDrawerSheet({
  isOpen,
  onClose,
  ...contentProps
}: AddContactAppAdapterResult): React.JSX.Element {
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
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 + keyboardInset }}>
        {isOpen ? (
          <Box lx={{ gap: "s24" }}>
            <BottomSheetHeader />
            <ContactsAddContactContent {...contentProps} />
          </Box>
        ) : null}
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
