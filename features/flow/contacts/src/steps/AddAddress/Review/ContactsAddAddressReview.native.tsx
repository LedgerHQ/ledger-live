import React from "react";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { LedgerLogo } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { ContactsAddAddressReviewViewProps } from "./types";

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

export type ContactsAddAddressReviewNativeProps = ContactsAddAddressReviewViewProps &
  Readonly<{
    bottomOffset?: number;
  }>;

export function ContactsAddAddressReview({
  address,
  currency,
  network,
  name,
  labels,
  bottomOffset = 0,
  onContinue,
}: ContactsAddAddressReviewNativeProps): React.JSX.Element {
  return (
    <BottomSheetView
      testID="contacts-add-address-review"
      style={{ bottom: 0, paddingBottom: 32 + bottomOffset }}
    >
      <BottomSheetHeader density="expanded" title={labels.title} />
      <Box style={{ flex: 1 }} lx={{ justifyContent: "space-between", gap: "s16" }}>
        <Box lx={{ gap: "s16" }}>
          <ReviewRow
            label={labels.addressLabel}
            testID="contacts-add-address-review-address"
            value={address}
          />
          <ReviewRow
            label={labels.currencyLabel}
            testID="contacts-add-address-review-currency"
            value={currency}
          />
          <ReviewRow
            label={labels.networkLabel}
            testID="contacts-add-address-review-network"
            value={network}
          />
          <ReviewRow
            label={labels.nameLabel}
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
          {labels.continue}
        </Button>
      </Box>
    </BottomSheetView>
  );
}
