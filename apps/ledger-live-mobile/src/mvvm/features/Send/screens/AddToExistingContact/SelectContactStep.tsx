import React from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { ContactsListView, type ContactsListViewNativeProps } from "@features/flow-contacts-list";

export type SelectContactStepProps = Omit<
  ContactsListViewNativeProps,
  "isLedgerSyncChecking" | "surface"
> &
  Readonly<{
    title: string;
    isOpeningAddressFlow: boolean;
  }>;

export function SelectContactStep({
  title,
  isOpeningAddressFlow,
  ...listProps
}: SelectContactStepProps): React.JSX.Element {
  return (
    <BottomSheetView style={{ flex: 1 }} accessibilityState={{ busy: isOpeningAddressFlow }}>
      <Box testID="send-add-to-existing-contact-step" lx={{ flex: 1 }}>
        <BottomSheetHeader density="expanded" title={title} />
        <ContactsListView
          {...listProps}
          surface="canvasSheet"
          isLedgerSyncChecking={isOpeningAddressFlow}
        />
      </Box>
    </BottomSheetView>
  );
}
