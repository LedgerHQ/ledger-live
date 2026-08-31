import React, { useCallback, useState } from "react";
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
  onOpen: _onOpen,
  ...contentProps
}: AddContactAppAdapterResult): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { isKeyboardVisible, keyboardHeight } = useKeyboardVisible({
    eventTiming: Platform.OS === "ios" ? "will" : "did",
  });
  const iosKeyboardGap = 32;
  const keyboardInset =
    isKeyboardVisible && shouldUseKeyboardAvoidance(Platform.OS, Platform.Version)
      ? keyboardHeight + (Platform.OS === "ios" ? iosKeyboardGap : 0)
      : 0;
  const [hasOpened, setHasOpened] = useState(false);
  const handleOpened = useCallback(() => setHasOpened(true), []);
  const handleClose = useCallback(() => {
    setHasOpened(false);
    onClose();
  }, [onClose]);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onOpened={handleOpened}
      onClose={handleClose}
      testID="contacts-add-contact-drawer"
      enableDynamicSizing
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 + keyboardInset }}>
        {isOpen ? (
          <Box lx={{ gap: "s24" }}>
            <BottomSheetHeader />
            <ContactsAddContactContent {...contentProps} autoFocus={hasOpened} />
          </Box>
        ) : null}
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
