import React from "react";
import {
  Card,
  CardContent,
  CardContentTitle,
  CardHeader,
  CardLeading,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { Plus } from "@ledgerhq/lumen-ui-react/symbols";

const ADD_ADDRESS_ICON_SIZE = 48;

type ContactAddressPickerAddAddressProps = Readonly<{
  label: string;
  onAddNewAddress: () => void;
}>;

export function ContactAddressPickerAddAddress({
  label,
  onAddNewAddress,
}: ContactAddressPickerAddAddressProps) {
  return (
    <Card type="interactive" onClick={onAddNewAddress} data-testid="pay-contact-address-add">
      <CardHeader>
        <CardLeading>
          <Spot appearance="icon" icon={Plus} size={ADD_ADDRESS_ICON_SIZE} />
          <CardContent>
            <CardContentTitle>{label}</CardContentTitle>
          </CardContent>
        </CardLeading>
      </CardHeader>
    </Card>
  );
}
