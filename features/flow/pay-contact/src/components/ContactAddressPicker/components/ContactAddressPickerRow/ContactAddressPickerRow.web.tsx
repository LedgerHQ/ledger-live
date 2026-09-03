import React from "react";
import {
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
} from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type { ContactAddressPickerProps, ContactAddressPickerRow } from "../../../../types";

const ASSET_ICON_SIZE = 48;

type ContactAddressPickerRowProps = Readonly<{
  row: ContactAddressPickerRow;
  onSelectAddress: ContactAddressPickerProps["onSelectAddress"];
}>;

export function ContactAddressPickerRow({ row, onSelectAddress }: ContactAddressPickerRowProps) {
  return (
    <Card
      type="interactive"
      onClick={() => onSelectAddress(row.contactAddress)}
      data-testid={`pay-contact-address-row-${row.addressId}`}
    >
      <CardHeader>
        <CardLeading>
          <CryptoIcon
            ledgerId={row.icon.ledgerId}
            ticker={row.icon.ticker}
            network={row.icon.network}
            size={ASSET_ICON_SIZE}
            shape="circle"
          />
          <CardContent>
            <CardContentTitle>{row.label}</CardContentTitle>
            <CardContentDescription>{row.address}</CardContentDescription>
          </CardContent>
        </CardLeading>
      </CardHeader>
    </Card>
  );
}
