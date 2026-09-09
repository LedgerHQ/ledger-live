import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { Plus } from "@ledgerhq/lumen-ui-rnative/symbols";

type ContactAddressPickerAddAddressProps = Readonly<{
  label: string;
  onAddNewAddress: () => void;
}>;

export function ContactAddressPickerAddAddress({
  label,
  onAddNewAddress,
}: ContactAddressPickerAddAddressProps) {
  return (
    <ListItem
      onPress={onAddNewAddress}
      testID="pay-contact-address-add"
      accessibilityLabel={label}
      lx={{ backgroundColor: "surface", borderRadius: "md" }}
    >
      <ListItemLeading>
        <Spot appearance="icon" icon={Plus} size={48} />
        <ListItemContent>
          <ListItemTitle>{label}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}
