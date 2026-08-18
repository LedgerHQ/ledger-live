import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
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
    <div className="flex flex-col gap-4" data-testid={testID}>
      <span className="body-2-semi-bold text-muted">{label}</span>
      <span className="body-1-semi-bold break-all text-base">{value}</span>
    </div>
  );
}

export function ContactsAddAddressReviewView({
  address,
  currency,
  network,
  name,
  labels,
  onContinue,
}: ContactsAddAddressReviewViewProps): React.JSX.Element {
  return (
    <div
      className="flex min-h-256 flex-col justify-between gap-24"
      data-testid="contacts-add-address-review"
    >
      <div className="flex flex-col gap-16">
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
      </div>
      <Button
        appearance="base"
        className="w-full"
        data-testid="contacts-add-address-review-continue"
        onClick={onContinue}
        size="lg"
      >
        {labels.continue}
      </Button>
    </div>
  );
}
