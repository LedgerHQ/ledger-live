import React, { useCallback, useState } from "react";
import { Platform } from "react-native";
import {
  ContactDetailActionsMenu,
  ContactsDeleteContactDialog,
  ContactsEditSignerDialog,
  ContactsEditSignerMismatchDialog,
} from "@features/flow-contacts";
import { ContactsRenameContactDrawer } from "@features/flow-contacts-edit-contact";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { shouldUseKeyboardAvoidance, useKeyboardVisible } from "~/logic/keyboardVisible";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import type { ContactDetailEditDeleteFlowProps } from "../../hooks/useContactDetailEditDeleteAdapter";

type ContactDetailEditDeleteSheetsProps = ContactDetailEditDeleteFlowProps;

export function ContactDetailEditDeleteSheets({
  actionsMenu,
  renameDrawer,
  deleteDrawer,
  signerDrawer,
  signerMismatchSheet,
}: ContactDetailEditDeleteSheetsProps): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { isKeyboardVisible, keyboardHeight } = useKeyboardVisible({
    eventTiming: Platform.OS === "ios" ? "will" : "did",
  });
  const iosKeyboardGap = 32;
  const keyboardInset =
    isKeyboardVisible && shouldUseKeyboardAvoidance(Platform.OS, Platform.Version)
      ? keyboardHeight + (Platform.OS === "ios" ? iosKeyboardGap : 0)
      : 0;
  const [hasRenameOpened, setHasRenameOpened] = useState(false);
  const onRenameOpened = useCallback(() => setHasRenameOpened(true), []);
  const onCloseRename = useCallback(() => {
    setHasRenameOpened(false);
    renameDrawer.onClose();
  }, [renameDrawer]);
  const { onClose: onCloseActionsMenuFromMenu, ...actionsMenuProps } = actionsMenu;
  const onCloseActionsMenu = useCallback(() => {
    onCloseActionsMenuFromMenu();
  }, [onCloseActionsMenuFromMenu]);
  const onCloseDelete = useCallback(() => {
    deleteDrawer.onCancel();
  }, [deleteDrawer]);
  const onCloseSigner = useCallback(() => {
    signerDrawer.onCancel();
  }, [signerDrawer]);
  const onCloseSignerMismatch = useCallback(() => {
    signerMismatchSheet.onCancel();
  }, [signerMismatchSheet]);

  return (
    <>
      <QueuedBottomSheet
        isRequestingToBeOpened={actionsMenu.isOpen}
        onClose={onCloseActionsMenu}
        testID="contacts-detail-actions-sheet"
        enableDynamicSizing
      >
        <ContactDetailActionsMenu {...actionsMenuProps} bottomInset={bottomInset} />
      </QueuedBottomSheet>
      <QueuedBottomSheet
        isRequestingToBeOpened={renameDrawer.isOpen}
        isForcingToBeOpened={renameDrawer.isOpen}
        onOpened={onRenameOpened}
        onClose={onCloseRename}
        testID="contacts-rename-contact-sheet"
        enableDynamicSizing
      >
        <ContactsRenameContactDrawer
          {...renameDrawer}
          bottomInset={bottomInset}
          keyboardInset={keyboardInset}
          autoFocus={hasRenameOpened}
        />
      </QueuedBottomSheet>
      <QueuedBottomSheet
        isRequestingToBeOpened={deleteDrawer.isOpen}
        isForcingToBeOpened={deleteDrawer.isOpen}
        onClose={onCloseDelete}
        testID="contacts-delete-contact-sheet"
        enableDynamicSizing
      >
        <ContactsDeleteContactDialog {...deleteDrawer} bottomInset={bottomInset} />
      </QueuedBottomSheet>
      <QueuedBottomSheet
        isRequestingToBeOpened={signerDrawer.isOpen}
        isForcingToBeOpened={signerDrawer.isOpen}
        onClose={onCloseSigner}
        testID="contacts-edit-signer-sheet"
        enableDynamicSizing
      >
        <ContactsEditSignerDialog {...signerDrawer} bottomInset={bottomInset} />
      </QueuedBottomSheet>
      <QueuedBottomSheet
        isRequestingToBeOpened={signerMismatchSheet.isOpen}
        isForcingToBeOpened={signerMismatchSheet.isOpen}
        onClose={onCloseSignerMismatch}
        testID="contacts-edit-signer-mismatch-sheet"
        enableDynamicSizing
      >
        <ContactsEditSignerMismatchDialog {...signerMismatchSheet} bottomInset={bottomInset} />
      </QueuedBottomSheet>
    </>
  );
}
