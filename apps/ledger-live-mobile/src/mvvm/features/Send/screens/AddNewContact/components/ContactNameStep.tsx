import React from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { ContactsAddContactContent } from "@features/flow-contacts-add-contact";
import type { AddContactAppAdapterResult } from "@features/flow-contacts";
import { useBottomSheetFooterInset } from "@shared/ui-queued-bottom-sheet";

export type ContactNameStepProps = AddContactAppAdapterResult &
  Readonly<{
    isVisible: boolean;
  }>;

export function ContactNameStep({
  isOpen: _isOpen,
  onOpen: _onOpen,
  onClose: _onClose,
  isVisible,
  ...contentProps
}: ContactNameStepProps): React.JSX.Element {
  const footerInset = useBottomSheetFooterInset();

  return (
    <BottomSheetView style={{ paddingBottom: footerInset }}>
      {isVisible ? (
        <Box lx={{ gap: "s24" }}>
          <BottomSheetHeader />
          <ContactsAddContactContent {...contentProps} autoFocus />
        </Box>
      ) : null}
    </BottomSheetView>
  );
}
