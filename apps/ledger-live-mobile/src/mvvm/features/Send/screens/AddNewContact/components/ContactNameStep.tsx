import React from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { ContactsAddContactContent } from "@features/flow-contacts-add-contact";
import type { AddContactAppAdapterResult } from "@features/flow-contacts";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CONTENT_BOTTOM_SPACING = 24;

export type ContactNameStepProps = AddContactAppAdapterResult &
  Readonly<{
    bottomOffset: number;
    isVisible: boolean;
  }>;

export function ContactNameStep({
  isOpen: _isOpen,
  onOpen: _onOpen,
  onClose: _onClose,
  bottomOffset,
  isVisible,
  ...contentProps
}: ContactNameStepProps): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING + bottomOffset }}>
      {/* The name input auto-focuses, so it is only mounted once the drawer is actually shown */}
      {isVisible ? (
        <Box lx={{ gap: "s24" }}>
          <BottomSheetHeader />
          <ContactsAddContactContent {...contentProps} />
        </Box>
      ) : null}
    </BottomSheetView>
  );
}
