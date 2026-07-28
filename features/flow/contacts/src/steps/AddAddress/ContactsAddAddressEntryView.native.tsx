import React, { useCallback } from "react";
import {
  AddressInput,
  Banner,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
} from "@ledgerhq/lumen-ui-rnative";
import type { AddAddressEntryLabels, AddAddressEntryState, AddAddressInputSource } from "./types";

export type ContactsAddAddressEntryViewProps = Readonly<{
  addressEntry: AddAddressEntryState;
  labels: AddAddressEntryLabels;
  bottomInset?: number;
  keyboardInset?: number;
  onChangeText: (value: string, inputMethod: AddAddressInputSource) => void;
  onQrCodeClick: () => void;
}>;

type AddressInputPresentation = Readonly<{
  status?: "error" | "success";
  helperText?: string;
  showEnsDisclaimer: boolean;
  isConfirmEnabled: boolean;
}>;

function getInsertedCharacterCount(previousValue: string, nextValue: string): number {
  let prefixLength = 0;
  while (
    prefixLength < previousValue.length &&
    prefixLength < nextValue.length &&
    previousValue[prefixLength] === nextValue[prefixLength]
  ) {
    prefixLength += 1;
  }

  let suffixLength = 0;
  while (
    suffixLength < previousValue.length - prefixLength &&
    suffixLength < nextValue.length - prefixLength &&
    previousValue[previousValue.length - 1 - suffixLength] ===
      nextValue[nextValue.length - 1 - suffixLength]
  ) {
    suffixLength += 1;
  }

  return nextValue.length - prefixLength - suffixLength;
}

function resolveAddressInputPresentation(
  addressEntry: AddAddressEntryState,
  labels: AddAddressEntryLabels,
): AddressInputPresentation {
  switch (addressEntry.status) {
    case "empty":
      return {
        showEnsDisclaimer: false,
        isConfirmEnabled: false,
      };
    case "validating":
      return {
        helperText: labels.validatingAddress,
        showEnsDisclaimer: false,
        isConfirmEnabled: false,
      };
    case "valid":
      return {
        status: "success",
        helperText: labels.validAddress,
        showEnsDisclaimer: addressEntry.inputMethod === "ens",
        isConfirmEnabled: true,
      };
    case "invalid":
      return {
        status: "error",
        helperText:
          addressEntry.error === "domain_not_found" ? labels.domainNotFound : labels.invalidAddress,
        showEnsDisclaimer: addressEntry.inputMethod === "ens",
        isConfirmEnabled: false,
      };
    case "unavailable":
      return {
        status: "error",
        helperText: labels.validationUnavailable,
        showEnsDisclaimer: false,
        isConfirmEnabled: false,
      };
  }
}

export function ContactsAddAddressEntryView({
  addressEntry,
  labels,
  bottomInset = 0,
  keyboardInset = 0,
  onChangeText,
  onQrCodeClick,
}: ContactsAddAddressEntryViewProps): React.JSX.Element {
  const presentation = resolveAddressInputPresentation(addressEntry, labels);
  const onAddressChange = useCallback(
    (value: string) => {
      const inputMethod =
        getInsertedCharacterCount(addressEntry.value, value) > 1 ? "paste" : "manual";
      onChangeText(value, inputMethod);
    },
    [addressEntry.value, onChangeText],
  );

  return (
    <BottomSheetView
      testID="contacts-add-address-entry-screen"
      style={{ paddingBottom: Math.max(bottomInset, keyboardInset) + 32 }}
    >
      <BottomSheetHeader density="expanded" title={labels.title} />
      <Box lx={{ flex: 1, justifyContent: "space-between", gap: "s16" }}>
        <Box lx={{ gap: "s16" }}>
          <AddressInput
            testID="contacts-add-address-input"
            prefix=""
            value={addressEntry.value}
            placeholder={labels.addressPlaceholder}
            onChangeText={onAddressChange}
            onQrCodeClick={onQrCodeClick}
            status={presentation.status}
            helperText={presentation.helperText}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
          />
          {presentation.showEnsDisclaimer ? (
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
          disabled={!presentation.isConfirmEnabled}
        >
          {labels.confirmAddress}
        </Button>
      </Box>
    </BottomSheetView>
  );
}
