import React, { useCallback } from "react";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  ContactAddressDetailDialog,
  type ContactAddressDetailDialogNativeProps,
} from "@features/flow-contacts";
import { Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";

type ContactAddressDetailDialogSheetProps = ContactAddressDetailDialogNativeProps &
  Readonly<{ isActionSheetOpen: boolean }>;

export function ContactAddressDetailDialogSheet({
  isOpen,
  isActionSheetOpen,
  onClose,
  ...dialogProps
}: ContactAddressDetailDialogSheetProps): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const onCopyAddress = useCallback((address: string) => {
    Clipboard.setString(address);
  }, []);
  const onShareAddress = useCallback((address: string) => {
    void Share.share({ message: address }).catch(() => undefined);
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
        bottomInset={bottomInset}
        onCopyAddress={onCopyAddress}
        onShareAddress={onShareAddress}
      />
    </QueuedBottomSheet>
  );
}
