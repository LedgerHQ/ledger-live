import React from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import {
  ContactsAddContactContent,
  ContactsAddContactFooter,
} from "@features/flow-contacts-add-contact";
import type { AddContactAppAdapterResult } from "@features/flow-contacts";
import { QueuedBottomSheet, useBottomSheetFooterInset } from "@shared/ui-queued-bottom-sheet";

export function ContactsAddContactDrawerSheet({
  isOpen,
  onClose,
  onOpen: _onOpen,
  ...contentProps
}: AddContactAppAdapterResult): React.JSX.Element {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      testID="contacts-add-contact-drawer"
      // Fixed height, so raising the keyboard over the name field cannot re-snap the sheet
      // mid-animation. The two then animate up together.
      snapPoints="fullWithOffset"
      footer={isOpen ? <ContactsAddContactFooter {...contentProps} /> : null}
    >
      <AddContactDrawerContent isOpen={isOpen} contentProps={contentProps} />
    </QueuedBottomSheet>
  );
}

type AddContactDrawerContentProps = Readonly<{
  isOpen: boolean;
  contentProps: Omit<AddContactAppAdapterResult, "isOpen" | "onOpen" | "onClose">;
}>;

function AddContactDrawerContent({
  isOpen,
  contentProps,
}: AddContactDrawerContentProps): React.JSX.Element {
  const footerInset = useBottomSheetFooterInset();

  return (
    <BottomSheetView style={{ paddingBottom: footerInset }}>
      {isOpen ? (
        <Box lx={{ gap: "s24" }}>
          <BottomSheetHeader />
          <ContactsAddContactContent {...contentProps} autoFocus />
        </Box>
      ) : null}
    </BottomSheetView>
  );
}
