import React from "react";
import {
  Banner,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Text,
  TextInput,
} from "@ledgerhq/lumen-ui-rnative";
import { LedgerLogo } from "@ledgerhq/lumen-ui-rnative/symbols";
import { CONTACT_ADDRESS_LABEL_MAX_LENGTH } from "@domain/entity-contact";
import type { ContactsAddAddressNameNativeProps } from "./types";

export function ContactsAddAddressName({
  addressLabel,
  labels,
  bottomOffset = 0,
  onChangeText,
  onContinue,
}: ContactsAddAddressNameNativeProps): React.JSX.Element {
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
          <Box lx={{ gap: "s8" }}>
            <TextInput
              testID="contacts-add-address-name-input"
              autoFocus
              autoCorrect={false}
              label={labels.inputLabel}
              value={addressLabel.value}
              helperText={validationMessage}
              maxLength={CONTACT_ADDRESS_LABEL_MAX_LENGTH}
              status={addressLabel.status === "invalid" ? "error" : undefined}
              onChangeText={onChangeText}
            />
            <Box lx={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <Text
                testID="contacts-add-address-name-count"
                typography="body3"
                accessibilityLiveRegion="polite"
                lx={{ color: "muted" }}
              >
                {`${addressLabel.value.length}/${CONTACT_ADDRESS_LABEL_MAX_LENGTH}`}
              </Text>
            </Box>
          </Box>
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
          icon={LedgerLogo}
          onPress={onContinue}
        >
          {labels.continueToReview}
        </Button>
      </Box>
    </BottomSheetView>
  );
}
