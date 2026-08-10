import React from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { ContactAddressDetailActions } from "./ContactAddressDetailActions.native";
import { ContactAddressDetailSummary } from "./ContactAddressDetailSummary.native";
import { useContactAddressDetailDialogViewModel } from "./useContactAddressDetailDialogViewModel.native";
import type { ContactAddressDetailDialogNativeProps } from "./types";

export type { ContactAddressDetailDialogNativeProps };

export function ContactAddressDetailDialog({
  isOpen,
  contactName,
  row,
  network,
  labels,
  bottomInset = 0,
  onCopyAddress,
  onSend,
  onEdit,
  onDelete,
  canSend = false,
  canEdit = false,
  canDelete = false,
}: ContactAddressDetailDialogNativeProps): React.JSX.Element {
  const { hasSelection, hasCopied, onCopy } = useContactAddressDetailDialogViewModel({
    isOpen,
    row,
    network,
    onCopyAddress,
  });

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
      {hasSelection && row !== undefined && network !== undefined ? (
        <>
          <BottomSheetHeader title={contactName} />
          <Box
            testID="contacts-address-detail-dialog"
            lx={{ paddingHorizontal: "s24", alignItems: "center" }}
          >
            <ContactAddressDetailSummary
              row={row}
              network={network}
              formatNetworkTag={labels.formatNetworkTag}
            />
            <ContactAddressDetailActions
              labels={labels}
              hasCopied={hasCopied}
              onCopy={onCopy}
              onSend={onSend}
              onEdit={onEdit}
              onDelete={onDelete}
              canSend={canSend}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          </Box>
        </>
      ) : null}
    </BottomSheetView>
  );
}
