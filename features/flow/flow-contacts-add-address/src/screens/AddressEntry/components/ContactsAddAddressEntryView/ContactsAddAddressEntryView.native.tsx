import React from "react";
import {
  AddressInput,
  Banner,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
} from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { CONTACTS_NATIVE_ADDRESS_INPUT_PROPS } from "@features/platform-contacts";
import type { ContactsAddAddressEntryViewProps } from "../ContactsAddAddressEntry/ContactsAddAddressEntry.types";
import { SanctionedAddressBanner } from "../../../../components/SanctionedAddressBanner/SanctionedAddressBanner";

export function ContactsAddAddressEntryView({
  value,
  labels,
  bottomOffset,
  bottomPadding,
  inputStatus,
  helperText,
  sanctionedAddressBanner,
  showEnsDisclaimer,
  isConfirmEnabled,
  onAddressChange,
  onConfirm,
  onQrCodeClick,
}: ContactsAddAddressEntryViewProps): React.JSX.Element {
  // `AddressInput` always mounts its prefix, so the empty prefix this screen needs still claims a
  // slot in the container gap and insets the address. Drop that gap and keep the spacing only
  // where it is needed, between the address and the trailing QR code / clear icon.
  const styles = useStyleSheet(
    t => ({
      inputContainer: { gap: 0 },
      input: { marginRight: t.spacings.s8 },
    }),
    [],
  );

  return (
    <BottomSheetView
      testID="contacts-add-address-entry-screen"
      style={{ bottom: 0, paddingBottom: bottomOffset > 0 ? bottomOffset : bottomPadding }}
    >
      <BottomSheetHeader density="expanded" title={labels.title} />
      <Box style={{ flex: 1 }} lx={{ justifyContent: "space-between", gap: "s16" }}>
        <Box lx={{ gap: "s16" }}>
          <AddressInput
            testID="contacts-add-address-input"
            prefix=""
            containerStyle={styles.inputContainer}
            inputStyle={styles.input}
            value={value}
            placeholder={labels.addressPlaceholder}
            onChangeText={onAddressChange}
            onQrCodeClick={onQrCodeClick}
            status={inputStatus}
            helperText={helperText}
            autoFocus
            {...CONTACTS_NATIVE_ADDRESS_INPUT_PROPS}
          />
          {sanctionedAddressBanner ? (
            <SanctionedAddressBanner {...sanctionedAddressBanner} />
          ) : null}
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
