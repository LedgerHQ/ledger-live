import React from "react";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { LedgerLogo } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useAddAddressReviewLabels } from "../../copy/useAddAddressReviewLabels";
import type { ContactsAddAddressReviewProps } from "./types";

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

type ContactsAddAddressReviewNativeProps = ContactsAddAddressReviewProps &
  Readonly<{
    bottomOffset?: number;
  }>;

export function ContactsAddAddressReview({
  addressEntry,
  addressLabel,
  displayContext,
  bottomOffset = 0,
  onContinue,
}: ContactsAddAddressReviewNativeProps): React.JSX.Element {
  const labels = useAddAddressReviewLabels();

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
            value={addressEntry.resolvedAddress}
          />
          <ReviewRow
            label={labels.currencyLabel}
            testID="contacts-add-address-review-currency"
            value={displayContext.assetDisplayName}
          />
          <ReviewRow
            label={labels.networkLabel}
            testID="contacts-add-address-review-network"
            value={displayContext.network.displayName}
          />
          <ReviewRow
            label={labels.nameLabel}
            testID="contacts-add-address-review-name"
            value={addressLabel.label}
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
