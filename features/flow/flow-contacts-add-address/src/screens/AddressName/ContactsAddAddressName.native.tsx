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
import { useLocalizedUrl, useOpenLink } from "@shared/platform-linking";
import { urls } from "../../urls";
import type { AddAddressLabelState, AddAddressNameLabels } from "../../state/types";

export type ContactsAddAddressNameProps = Readonly<{
  addressLabel: AddAddressLabelState;
  labels: AddAddressNameLabels;
  bottomOffset?: number;
  onChangeText: (value: string) => void;
  onContinue: () => void;
}>;

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
        <Box lx={{ gap: "s16", alignItems: "center" }}>
          {labels.privacyPolicy ? (
            <Link
              testID="contacts-add-address-name-privacy-policy"
              appearance="base"
              size="sm"
              underline={false}
              isExternal
              onPress={handlePressPrivacyPolicy}
            >
              {labels.privacyPolicy}
            </Link>
          ) : null}
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
      </Box>
    </BottomSheetView>
  );
}
