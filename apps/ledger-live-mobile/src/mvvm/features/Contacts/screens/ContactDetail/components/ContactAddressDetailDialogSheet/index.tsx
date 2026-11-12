import React, { useCallback } from "react";
import {
  ContactAddressDetailDialog,
  type ContactAddressDetailDialogProps,
} from "@features/flow-contacts-detail";
import { Share } from "react-native";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { leaveAppFor } from "LLM/features/AppLock/adapters/appVisibility";

type ContactAddressDetailDialogSheetProps = ContactAddressDetailDialogProps &
  Readonly<{ isActionSheetOpen: boolean }>;

export function ContactAddressDetailDialogSheet({
  isOpen,
  isActionSheetOpen,
  onClose,
  ...dialogProps
}: ContactAddressDetailDialogSheetProps): React.JSX.Element {
  const onShareAddress = useCallback((address: string) => {
    void leaveAppFor(() => Share.share({ message: address })).catch(() => undefined);
  }, []);

  // While an action sheet owns the screen this sheet must not sit in the queue. Closing that action
  // sheet can also clear the selection, and the queue promotes whatever is waiting behind it before
  // React sees that, which would leave an empty sheet the user has to dismiss to reach the app.
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen && !isActionSheetOpen}
      onClose={onClose}
      testID="contacts-address-detail-sheet"
      enableDynamicSizing
    >
      <ContactAddressDetailDialog
        {...dialogProps}
        isOpen={isOpen}
        onClose={onClose}
        onShareAddress={onShareAddress}
      />
    </QueuedBottomSheet>
  );
}
