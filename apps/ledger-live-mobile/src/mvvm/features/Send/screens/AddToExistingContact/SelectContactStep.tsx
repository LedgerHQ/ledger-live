import React from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import {
  ContactsListView,
  type ContactsListViewNativeProps,
} from "@features/flow-contacts-list/native";
import { useTranslation } from "~/context/Locale";

export type SelectContactStepProps = Omit<
  ContactsListViewNativeProps,
  "isLedgerSyncChecking" | "surface" | "titleContext"
> &
  Readonly<{
    isOpeningAddressFlow: boolean;
  }>;

export function SelectContactStep({
  isOpeningAddressFlow,
  ...listProps
}: SelectContactStepProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <BottomSheetView style={{ flex: 1 }} accessibilityState={{ busy: isOpeningAddressFlow }}>
      <Box testID="send-add-to-existing-contact-step" lx={{ flex: 1 }}>
        <BottomSheetHeader
          density="expanded"
          title={t("send.newSendFlow.addContact.selectContact")}
        />
        <ContactsListView
          {...listProps}
          surface="canvasSheet"
          titleContext="selectContact"
          isLedgerSyncChecking={isOpeningAddressFlow}
        />
      </Box>
    </BottomSheetView>
  );
}
