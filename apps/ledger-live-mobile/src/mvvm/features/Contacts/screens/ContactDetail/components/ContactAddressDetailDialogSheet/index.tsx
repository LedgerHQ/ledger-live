import React, { useCallback } from "react";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  ContactAddressDetailDialog,
  type ContactAddressDetailDialogNativeProps,
} from "@features/flow-contacts";
import { Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";

export function ContactAddressDetailDialogSheet({
  isOpen,
  onClose,
  ...dialogProps
}: ContactAddressDetailDialogNativeProps): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const onCopyAddress = useCallback((address: string) => {
    Clipboard.setString(address);
  }, []);
  const onShareAddress = useCallback((address: string) => {
    void Share.share({ message: address }).catch(() => undefined);
  }, []);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
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
