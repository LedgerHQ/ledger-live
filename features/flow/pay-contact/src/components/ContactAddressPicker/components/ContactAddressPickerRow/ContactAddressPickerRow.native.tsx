import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-rnative";
import type { ContactAddressPickerProps, ContactAddressPickerRow } from "../../../../types";

const ASSET_ICON_SIZE = 48;

type ContactAddressPickerRowProps = Readonly<{
  row: ContactAddressPickerRow;
  onSelectAddress: ContactAddressPickerProps["onSelectAddress"];
}>;

export function ContactAddressPickerRow({ row, onSelectAddress }: ContactAddressPickerRowProps) {
  return (
    <ListItem
      onPress={() => onSelectAddress(row.contactAddress)}
      testID={`pay-contact-address-row-${row.addressId}`}
      accessibilityLabel={`${row.label}, ${row.contactAddress.address}`}
      lx={{ backgroundColor: "surface", borderRadius: "md" }}
    >
      <ListItemLeading>
        <CryptoIcon
          ledgerId={row.icon.ledgerId}
          ticker={row.icon.ticker}
          network={row.icon.network}
          size={ASSET_ICON_SIZE}
          shape="circle"
        />
        <ListItemContent>
          <ListItemTitle>{row.label}</ListItemTitle>
          <ListItemDescription>{row.address}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}
