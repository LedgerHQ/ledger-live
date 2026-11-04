import React from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import { ContactAddressDetailActions } from "./ContactAddressDetailActions";
import { ContactAddressDetailSummary } from "./ContactAddressDetailSummary";
import { useContactAddressDetailDialogViewModel } from "./useContactAddressDetailDialogViewModel";
import type { ContactAddressDetailDialogProps } from "./ContactAddressDetailDialog.types";

export function ContactAddressDetailDialog({
  isOpen,
  contactName,
  row,
  network,
  onShareAddress,
  onSend,
  onEdit,
  onDelete,
  canSend = false,
  canEdit = false,
  canDelete = false,
}: ContactAddressDetailDialogProps): React.JSX.Element {
  const bottomInset = useBottomSheetBottomInset();
  const { hasSelection, hasCopied, onCopy, onShare } = useContactAddressDetailDialogViewModel({
    isOpen,
    row,
    network,
    onShareAddress,
  });

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
      {hasSelection && row !== undefined && network !== undefined ? (
        <>
          <BottomSheetHeader title={contactName} />
          <Box testID="contacts-address-detail-dialog" lx={{ alignItems: "center" }}>
            <Box lx={{ paddingHorizontal: "s24" }}>
              <ContactAddressDetailSummary row={row} network={network} />
            </Box>
            <ContactAddressDetailActions
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
