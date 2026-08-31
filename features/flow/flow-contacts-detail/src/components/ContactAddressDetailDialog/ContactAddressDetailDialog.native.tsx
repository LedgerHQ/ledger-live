import React from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { ContactAddressDetailActions } from "./ContactAddressDetailActions";
import { ContactAddressDetailSummary } from "./ContactAddressDetailSummary";
import { useContactAddressDetailDialogViewModel } from "./useContactAddressDetailDialogViewModel";
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
  onShareAddress,
  onSend,
  onEdit,
  onDelete,
  canSend = false,
  canEdit = false,
  canDelete = false,
}: ContactAddressDetailDialogNativeProps): React.JSX.Element {
  const { hasSelection, hasCopied, onCopy, onShare } = useContactAddressDetailDialogViewModel({
    isOpen,
    row,
    network,
    onCopyAddress,
    onShareAddress,
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
              onShare={onShare}
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
