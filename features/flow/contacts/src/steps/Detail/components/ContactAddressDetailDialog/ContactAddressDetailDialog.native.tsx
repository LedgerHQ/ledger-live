import React, { useEffect, useState } from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { ContactAddressDetailActions } from "./ContactAddressDetailActions.native";
import { ContactAddressDetailSummary } from "./ContactAddressDetailSummary.native";
import type { ContactAddressDetailDialogNativeProps } from "./types";

const COPY_FEEDBACK_MS = 3000;

export type { ContactAddressDetailDialogNativeProps };

export function ContactAddressDetailDialog({
  isOpen,
  contactName,
  row,
  network,
  labels,
  bottomInset = 0,
  onCopyAddress,
}: ContactAddressDetailDialogNativeProps): React.JSX.Element {
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setHasCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!hasCopied) {
      return;
    }

    const timeoutId = setTimeout(() => setHasCopied(false), COPY_FEEDBACK_MS);

    return () => clearTimeout(timeoutId);
  }, [hasCopied]);

  const handleCopy = () => {
    if (row === undefined) {
      return;
    }

    onCopyAddress?.(row.address);
    setHasCopied(true);
  };

  const hasSelection = isOpen && row !== undefined && network !== undefined;

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
      {hasSelection ? (
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
              onCopy={handleCopy}
            />
          </Box>
        </>
      ) : null}
    </BottomSheetView>
  );
}
