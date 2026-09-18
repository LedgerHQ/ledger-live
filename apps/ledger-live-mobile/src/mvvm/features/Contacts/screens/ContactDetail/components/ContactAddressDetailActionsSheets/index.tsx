import React, { useCallback } from "react";
import {
  ContactsDeleteAddressDialog,
  ContactsEditSignerMismatchDialog,
} from "@features/flow-contacts";
import { ContactsRenameAddressDialog } from "@features/flow-contacts-edit-address";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import type { ContactAddressDetailActionsFlowProps } from "LLM/features/Contacts";

type ContactAddressDetailActionsSheetsProps = Pick<
  ContactAddressDetailActionsFlowProps,
  "deleteSheet" | "renameSheet" | "signerMismatchSheet"
>;

export function ContactAddressDetailActionsSheets({
  deleteSheet,
  renameSheet,
  signerMismatchSheet,
}: ContactAddressDetailActionsSheetsProps): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const onCloseDelete = useCallback(() => {
    deleteSheet.onCancel();
  }, [deleteSheet]);
  const onCloseSignerMismatch = useCallback(() => {
    signerMismatchSheet.onCancel();
  }, [signerMismatchSheet]);

  return (
    <>
      <QueuedBottomSheet
        isRequestingToBeOpened={deleteSheet.isOpen}
        isForcingToBeOpened={deleteSheet.isOpen}
        onClose={onCloseDelete}
        testID="contacts-delete-address-sheet"
        enableDynamicSizing
      >
        <ContactsDeleteAddressDialog {...deleteSheet} bottomInset={bottomInset} />
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
      <QueuedBottomSheet
        isRequestingToBeOpened={renameSheet.isOpen}
        isForcingToBeOpened={renameSheet.isOpen}
        onClose={renameSheet.onClose}
        testID="contacts-rename-address-sheet"
        // Fixed height, so raising the keyboard over the address field cannot re-snap the sheet
        // mid-animation. The two then animate up together.
        snapPoints="fullWithOffset"
      >
        <ContactsRenameAddressDialog {...renameSheet} autoFocus bottomInset={bottomInset} />
      </QueuedBottomSheet>
    </>
  );
}
