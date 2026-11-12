import React, { useCallback } from "react";
import { ContactsEditSignerMismatchDialog } from "@features/flow-contacts-detail";
import { ContactDetailActionsMenu } from "@features/flow-contacts-detail/native";
import { ContactsDeleteContactDialog } from "@features/flow-contacts-delete-contact";
import { ContactsRenameContactDialog } from "@features/flow-contacts-edit-contact";
import { ContactsRenameContactFooter } from "@features/flow-contacts-edit-contact/native";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import type { ContactDetailEditDeleteFlowProps } from "../../hooks/useContactDetailEditDeleteAdapter";

type ContactDetailEditDeleteSheetsProps = ContactDetailEditDeleteFlowProps &
  Readonly<{ onDeleteSheetDismissed?: () => void }>;

export function ContactDetailEditDeleteSheets({
  actionsMenu,
  renameSheet,
  deleteSheet,
  signerMismatchSheet,
  onDeleteSheetDismissed,
}: ContactDetailEditDeleteSheetsProps): React.JSX.Element {
  const { onClose: onCloseActionsMenuFromMenu, ...actionsMenuProps } = actionsMenu;
  const onCloseActionsMenu = useCallback(() => {
    onCloseActionsMenuFromMenu();
  }, [onCloseActionsMenuFromMenu]);
  const onCloseDelete = useCallback(() => {
    deleteSheet.onCancel();
  }, [deleteSheet]);
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
        <ContactDetailActionsMenu {...actionsMenuProps} />
      </QueuedBottomSheet>
      <QueuedBottomSheet
        isRequestingToBeOpened={renameSheet.isOpen}
        isForcingToBeOpened={renameSheet.isOpen}
        onClose={renameSheet.onClose}
        testID="contacts-rename-contact-sheet"
        // Fixed height, so raising the keyboard over the name field cannot re-snap the sheet
        // mid-animation. The two then animate up together.
        snapPoints="fullWithOffset"
        footer={renameSheet.isOpen ? <ContactsRenameContactFooter {...renameSheet} /> : null}
      >
        <ContactsRenameContactDialog {...renameSheet} autoFocus />
      </QueuedBottomSheet>
      <QueuedBottomSheet
        isRequestingToBeOpened={deleteSheet.isOpen}
        isForcingToBeOpened={deleteSheet.isOpen}
        onClose={onCloseDelete}
        onModalHide={onDeleteSheetDismissed}
        testID="contacts-delete-contact-sheet"
        enableDynamicSizing
      >
        <ContactsDeleteContactDialog {...deleteSheet} />
      </QueuedBottomSheet>
      <QueuedBottomSheet
        isRequestingToBeOpened={signerMismatchSheet.isOpen}
        isForcingToBeOpened={signerMismatchSheet.isOpen}
        onClose={onCloseSignerMismatch}
        testID="contacts-edit-signer-mismatch-sheet"
        enableDynamicSizing
      >
        <ContactsEditSignerMismatchDialog {...signerMismatchSheet} />
      </QueuedBottomSheet>
    </>
  );
}
