import React, { useCallback } from "react";
import {
  Banner,
  BottomSheetHeader,
  BottomSheetView,
  Box,
  Button,
  Link,
  Text,
  TextInput,
} from "@ledgerhq/lumen-ui-rnative";
import { LedgerLogo } from "@ledgerhq/lumen-ui-rnative/symbols";
import { CONTACT_ADDRESS_LABEL_MAX_LENGTH } from "@domain/entity-contact";
import { CONTACTS_NATIVE_NAME_INPUT_PROPS } from "@features/platform-contacts";
import { useTranslation } from "@shared/i18n";
import { useLocalizedUrl, useOpenLink } from "@shared/linking";
import { useAddAddressNameValidationErrors } from "../../copy/useAddAddressNameValidationErrors";
import { urls } from "../../urls";
import type { AddAddressLabelState } from "../../state/types";

export type AddAddressNameNextStep = "review" | "confirmation";

export type ContactsAddAddressNameProps = Readonly<{
  addressLabel: AddAddressLabelState;
  nextStep?: AddAddressNameNextStep;
  bottomOffset?: number;
  onChangeText: (value: string) => void;
  onContinue: () => void;
}>;

export function ContactsAddAddressName({
  addressLabel,
  nextStep = "review",
  bottomOffset = 0,
  onChangeText,
  onContinue,
}: ContactsAddAddressNameProps): React.JSX.Element {
  const { t } = useTranslation();
  const validationErrors = useAddAddressNameValidationErrors();
  const validationMessage = addressLabel.validationError
    ? validationErrors[addressLabel.validationError]
    : undefined;
  const title = t("contacts.addAddressName.title");
  const inputLabel = t("contacts.addAddressName.inputLabel");
  const namingDisclaimer = t("contacts.addAddressName.namingDisclaimer");
  const continueLabel =
    nextStep === "confirmation"
      ? t("common.continue")
      : t("contacts.addAddressName.continueToReview");
  const privacyPolicy = t("contacts.addAddressName.privacyPolicy");
  const openLink = useOpenLink();
  const localizedPrivacyPolicyUrl = useLocalizedUrl(urls.privacyPolicy.native);
  const handlePressPrivacyPolicy = useCallback(() => {
    openLink(localizedPrivacyPolicyUrl);
  }, [openLink, localizedPrivacyPolicyUrl]);

  return (
    <BottomSheetView
      testID="contacts-add-address-name-screen"
      style={{ bottom: 0, paddingBottom: bottomOffset > 0 ? bottomOffset : 32 }}
    >
      <BottomSheetHeader density="expanded" title={title} />
      <Box style={{ flex: 1 }} lx={{ justifyContent: "space-between", gap: "s16" }}>
        <Box lx={{ gap: "s16" }}>
          <Box lx={{ gap: "s8" }}>
            <TextInput
              testID="contacts-add-address-name-input"
              autoFocus
              label={inputLabel}
              value={addressLabel.value}
              helperText={validationMessage}
              maxLength={CONTACT_ADDRESS_LABEL_MAX_LENGTH}
              status={addressLabel.status === "invalid" ? "error" : undefined}
              onChangeText={onChangeText}
              {...CONTACTS_NATIVE_NAME_INPUT_PROPS}
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
            description={namingDisclaimer}
          />
        </Box>
        <Box lx={{ gap: "s16", alignItems: "center" }}>
          <Link
            testID="contacts-add-address-name-privacy-policy"
            appearance="base"
            size="sm"
            underline={false}
            isExternal
            onPress={handlePressPrivacyPolicy}
          >
            {privacyPolicy}
          </Link>
          <Button
            testID="contacts-add-address-name-continue"
            appearance="base"
            size="lg"
            isFull
            disabled={addressLabel.status !== "valid"}
            icon={LedgerLogo}
            onPress={onContinue}
          >
            {continueLabel}
          </Button>
        </Box>
      </Box>
    </BottomSheetView>
  );
}
