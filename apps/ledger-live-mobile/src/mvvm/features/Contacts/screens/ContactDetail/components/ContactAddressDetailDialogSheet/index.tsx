import React, { useCallback } from "react";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  ContactAddressDetailDialog,
  type ContactAddressDetailDialogNativeProps,
} from "@features/flow-contacts";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueuedBottomSheet from "LLM/components/QueuedDrawer/QueuedBottomSheet";

export function ContactAddressDetailDialogSheet({
  isOpen,
  onClose,
  ...dialogProps
}: ContactAddressDetailDialogNativeProps): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const onCopyAddress = useCallback((address: string) => {
    Clipboard.setString(address);
  }, []);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      testID="contacts-address-detail-sheet"
      enableDynamicSizing
    >
      <ContactAddressDetailDialog
        isOpen={isOpen}
        onClose={onClose}
        bottomInset={bottomInset}
        onCopyAddress={onCopyAddress}
        {...dialogProps}
      />
    </QueuedBottomSheet>
  );
}
