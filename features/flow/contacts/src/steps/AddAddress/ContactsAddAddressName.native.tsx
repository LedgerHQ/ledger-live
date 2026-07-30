import React from "react";
import {
  Banner,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  TextInput,
} from "@ledgerhq/lumen-ui-rnative";
import type { ContactsAddAddressNameProps } from "./ContactsAddAddressName.types";

export function ContactsAddAddressName({
  addressLabel,
  labels,
  bottomOffset = 0,
  onChangeText,
  onContinue,
}: ContactsAddAddressNameProps): React.JSX.Element {
  const validationMessage = addressLabel.validationError
    ? labels.validationErrors[addressLabel.validationError]
    : undefined;

  return (
    <BottomSheetView
      testID="contacts-add-address-name-screen"
      style={{ bottom: bottomOffset, paddingBottom: 32 }}
    >
      <BottomSheetHeader density="expanded" title={labels.title} />
      <Box style={{ flex: 1 }} lx={{ justifyContent: "space-between", gap: "s16" }}>
        <Box lx={{ gap: "s16" }}>
          <TextInput
            testID="contacts-add-address-name-input"
            autoFocus
            autoCorrect={false}
            label={labels.inputLabel}
            value={addressLabel.value}
            helperText={validationMessage}
            status={addressLabel.status === "invalid" ? "error" : undefined}
            onChangeText={onChangeText}
          />
          <Banner
            testID="contacts-add-address-name-disclaimer"
            appearance="info"
            description={labels.namingDisclaimer}
          />
        </Box>
        <Button
          testID="contacts-add-address-name-continue"
          appearance="base"
          size="lg"
          isFull
          disabled={addressLabel.status !== "valid"}
          onPress={onContinue}
        >
          {labels.continueToReview}
        </Button>
      </Box>
    </BottomSheetView>
  );
}
