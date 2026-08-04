import React, { useCallback } from "react";
import { Platform } from "react-native";
import {
  ContactDetailActionsMenu,
  ContactsDeleteContactDialog,
  ContactsEditSignerDialog,
  ContactsRenameContactDrawer,
} from "@features/flow-contacts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { shouldUseKeyboardAvoidance, useKeyboardVisible } from "~/logic/keyboardVisible";
import QueuedBottomSheet from "LLM/components/QueuedDrawer/QueuedBottomSheet";
import type { ContactDetailEditDeleteFlowProps } from "../../hooks/useContactDetailEditDeleteAdapter";

type ContactDetailEditDeleteSheetsProps = ContactDetailEditDeleteFlowProps;

export function ContactDetailEditDeleteSheets({
  actionsMenu,
  renameDrawer,
  deleteDrawer,
  signerDrawer,
}: ContactDetailEditDeleteSheetsProps): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { keyboardHeight } = useKeyboardVisible({
    eventTiming: Platform.OS === "ios" ? "will" : "did",
  });
  const keyboardInset = shouldUseKeyboardAvoidance(Platform.OS, Platform.Version)
    ? keyboardHeight
    : 0;
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
        onClose={renameDrawer.onClose}
        testID="contacts-rename-contact-sheet"
        enableDynamicSizing
      >
        <ContactsRenameContactDrawer
          {...renameDrawer}
          bottomInset={bottomInset}
          keyboardInset={keyboardInset}
        />
      </QueuedBottomSheet>
      <QueuedBottomSheet
        isRequestingToBeOpened={deleteDrawer.isOpen}
        onClose={onCloseDelete}
        testID="contacts-delete-contact-sheet"
        enableDynamicSizing
      >
        <ContactsDeleteContactDialog {...deleteDrawer} bottomInset={bottomInset} />
      </QueuedBottomSheet>
      <QueuedBottomSheet
        isRequestingToBeOpened={signerDrawer.isOpen}
        onClose={onCloseSigner}
        testID="contacts-edit-signer-sheet"
        enableDynamicSizing
      >
        <ContactsEditSignerDialog {...signerDrawer} bottomInset={bottomInset} />
      </QueuedBottomSheet>
    </>
  );
}
