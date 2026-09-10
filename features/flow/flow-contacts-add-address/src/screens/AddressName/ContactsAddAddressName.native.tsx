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
import {
  CONTACT_ADDRESS_LABEL_MAX_LENGTH,
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
} from "@domain/entity-contact";
import type { AddAddressLabelState } from "../../state/types";
import { useTranslation } from "@shared/i18n";

export type ContactsAddAddressNameProps = Readonly<{
  addressLabel: AddAddressLabelState;
  bottomOffset?: number;
  onChangeText: (value: string) => void;
  onContinue: () => void;
}>;

export function ContactsAddAddressName({
  addressLabel,
  bottomOffset = 0,
  onChangeText,
  onContinue,
}: ContactsAddAddressNameProps): React.JSX.Element {
  const { t } = useTranslation();
  const validationErrors = {
    [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.addAddressName.invalidLabel"),
    [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.addAddressName.duplicateLabel"),
    [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]: t("contacts.addAddressName.labelTooLong"),
  };
  const validationMessage = addressLabel.validationError
    ? validationErrors[addressLabel.validationError]
    : undefined;

  return (
    <BottomSheetView
      testID="contacts-add-address-name-screen"
      style={{ bottom: 0, paddingBottom: bottomOffset > 0 ? bottomOffset : 32 }}
    >
      <BottomSheetHeader density="expanded" title={t("contacts.addAddressName.title")} />
      <Box style={{ flex: 1 }} lx={{ justifyContent: "space-between", gap: "s16" }}>
        <Box lx={{ gap: "s16" }}>
          <Box lx={{ gap: "s8" }}>
            <TextInput
              testID="contacts-add-address-name-input"
              autoFocus
              autoCorrect={false}
              label={t("contacts.addAddressName.inputLabel")}
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
            description={t("contacts.addAddressName.namingDisclaimer")}
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
          {t("contacts.addAddressName.continueToReview")}
        </Button>
      </Box>
    </BottomSheetView>
  );
}
