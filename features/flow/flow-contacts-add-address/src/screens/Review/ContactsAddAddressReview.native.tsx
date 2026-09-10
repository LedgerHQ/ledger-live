import React from "react";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { LedgerLogo } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { ContactsAddAddressReviewViewProps } from "./types";
import { useTranslation } from "@shared/i18n";

function ReviewRow({
  label,
  value,
  testID,
}: Readonly<{
  label: string;
  value: string;
  testID: string;
}>): React.JSX.Element {
  return (
    <Box testID={testID} lx={{ gap: "s4" }}>
      <Text typography="body3" lx={{ color: "muted" }}>
        {label}
      </Text>
      <Text typography="body2SemiBold" lx={{ color: "base" }}>
        {value}
      </Text>
    </Box>
  );
}

export type ContactsAddAddressReviewNativeProps = Omit<
  ContactsAddAddressReviewViewProps,
  "labels"
> &
  Readonly<{
    bottomOffset?: number;
  }>;

export function ContactsAddAddressReview({
  address,
  currency,
  network,
  name,
  bottomOffset = 0,
  onContinue,
}: ContactsAddAddressReviewNativeProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <BottomSheetView
      testID="contacts-add-address-review"
      style={{ bottom: 0, paddingBottom: 32 + bottomOffset }}
    >
      <BottomSheetHeader density="expanded" title={t("contacts.addAddressReview.title")} />
      <Box style={{ flex: 1 }} lx={{ justifyContent: "space-between", gap: "s16" }}>
        <Box lx={{ gap: "s16" }}>
          <ReviewRow
            label={t("contacts.addAddressReview.addressLabel")}
            testID="contacts-add-address-review-address"
            value={address}
          />
          <ReviewRow
            label={t("contacts.addAddressReview.currencyLabel")}
            testID="contacts-add-address-review-currency"
            value={currency}
          />
          <ReviewRow
            label={t("contacts.addAddressReview.networkLabel")}
            testID="contacts-add-address-review-network"
            value={network}
          />
          <ReviewRow
            label={t("contacts.addAddressReview.nameLabel")}
            testID="contacts-add-address-review-name"
            value={name}
          />
        </Box>
        <Button
          testID="contacts-add-address-review-continue"
          appearance="base"
          size="lg"
          isFull
          icon={LedgerLogo}
          onPress={onContinue}
        >
          {t("contacts.addAddressReview.continue")}
        </Button>
      </Box>
    </BottomSheetView>
  );
}
