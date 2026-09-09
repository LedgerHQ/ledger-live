import React, { useCallback } from "react";
import {
  ContactDetailActionsMenu,
  ContactsEditSignerMismatchDialog,
} from "@features/flow-contacts";
import { ContactsDeleteContactDialog } from "@features/flow-contacts-delete-contact";
import {
  ContactsRenameContactDrawer,
  ContactsRenameContactFooter,
} from "@features/flow-contacts-edit-contact";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet, useBottomSheetFooterInset } from "@shared/ui-queued-bottom-sheet";
import type { ContactDetailEditDeleteFlowProps } from "../../hooks/useContactDetailEditDeleteAdapter";

type ContactDetailEditDeleteSheetsProps = ContactDetailEditDeleteFlowProps;

export function ContactDetailEditDeleteSheets({
  actionsMenu,
  renameDrawer,
  deleteDrawer,
  signerMismatchSheet,
}: ContactDetailEditDeleteSheetsProps): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { onClose: onCloseActionsMenuFromMenu, ...actionsMenuProps } = actionsMenu;
  const onCloseActionsMenu = useCallback(() => {
    onCloseActionsMenuFromMenu();
  }, [onCloseActionsMenuFromMenu]);
  const onCloseDelete = useCallback(() => {
    deleteDrawer.onCancel();
  }, [deleteDrawer]);
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
        onClose={renameDrawer.onClose}
        testID="contacts-rename-contact-sheet"
        // Fixed height, so raising the keyboard over the name field cannot re-snap the sheet
        // mid-animation. The two then animate up together.
        snapPoints="fullWithOffset"
        footer={renameDrawer.isOpen ? <ContactsRenameContactFooter {...renameDrawer} /> : null}
      >
        <RenameContactDrawer {...renameDrawer} />
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

function RenameContactDrawer(
  props: ContactDetailEditDeleteFlowProps["renameDrawer"],
): React.JSX.Element {
  const footerInset = useBottomSheetFooterInset();
  return <ContactsRenameContactDrawer {...props} autoFocus bottomInset={footerInset} />;
}
