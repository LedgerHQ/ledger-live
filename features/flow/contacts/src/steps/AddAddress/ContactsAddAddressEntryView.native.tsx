import React from "react";
import {
  AddressInput,
  Banner,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
} from "@ledgerhq/lumen-ui-rnative";
import type { ContactsAddAddressEntryViewProps } from "./ContactsAddAddressEntry.types";

export function ContactsAddAddressEntryView({
  value,
  labels,
  bottomOffset,
  bottomPadding,
  inputStatus,
  helperText,
  showEnsDisclaimer,
  isConfirmEnabled,
  onAddressChange,
  onConfirm,
  onQrCodeClick,
}: ContactsAddAddressEntryViewProps): React.JSX.Element {
  return (
    <BottomSheetView
      testID="contacts-add-address-entry-screen"
      style={{ bottom: bottomOffset, paddingBottom: bottomPadding }}
    >
      <BottomSheetHeader density="expanded" title={labels.title} />
      <Box style={{ flex: 1 }} lx={{ justifyContent: "space-between", gap: "s16" }}>
        <Box lx={{ gap: "s16" }}>
          <AddressInput
            testID="contacts-add-address-input"
            prefix=""
            value={value}
            placeholder={labels.addressPlaceholder}
            onChangeText={onAddressChange}
            onQrCodeClick={onQrCodeClick}
            status={inputStatus}
            helperText={helperText}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
          />
          {showEnsDisclaimer ? (
            <Banner
              testID="contacts-add-address-ens-disclaimer"
              appearance="info"
              description={labels.ensDisclaimer}
            />
          ) : null}
        </Box>
        <Button
          testID="contacts-add-address-confirm"
          appearance="base"
          size="lg"
          isFull
          disabled={!isConfirmEnabled}
          onPress={onConfirm}
        >
          {labels.confirmAddress}
        </Button>
      </Box>
    </BottomSheetView>
  );
}
