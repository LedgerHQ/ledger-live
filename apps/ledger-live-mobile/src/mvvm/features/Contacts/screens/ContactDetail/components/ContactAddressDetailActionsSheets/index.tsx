import React, { useCallback } from "react";
import {
  ContactsDeleteAddressDialog,
  ContactsEditSignerDialog,
  ContactsEditSignerMismatchDialog,
} from "@features/flow-contacts";
import { ContactsRenameAddressDialog } from "@features/flow-contacts-edit-address";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import type { ContactAddressDetailActionsFlowProps } from "LLM/features/Contacts";

type ContactAddressDetailActionsSheetsProps = Pick<
  ContactAddressDetailActionsFlowProps,
  "deleteSheet" | "renameSheet" | "signerSheet" | "signerMismatchSheet"
>;

export function ContactAddressDetailActionsSheets({
  deleteSheet,
  renameSheet,
  signerSheet,
  signerMismatchSheet,
}: ContactAddressDetailActionsSheetsProps): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const onCloseDelete = useCallback(() => {
    deleteSheet.onCancel();
  }, [deleteSheet]);
  const onCloseSigner = useCallback(() => {
    signerSheet.onCancel();
  }, [signerSheet]);
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
        isRequestingToBeOpened={signerSheet.isOpen}
        isForcingToBeOpened={signerSheet.isOpen}
        onClose={onCloseSigner}
        testID="contacts-address-detail-signer-sheet"
        enableDynamicSizing
      >
        <ContactsEditSignerDialog {...signerSheet} bottomInset={bottomInset} />
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
        enableDynamicSizing
      >
        <ContactsRenameAddressDialog {...renameSheet} bottomInset={bottomInset} />
      </QueuedBottomSheet>
    </>
  );
}
