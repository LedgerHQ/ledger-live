import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type {
  ContactAddressPickerNetworkGroup,
  ContactAddressPickerProps,
} from "../../../../types";
import { ContactAddressPickerRow } from "../ContactAddressPickerRow/ContactAddressPickerRow.native";

const NETWORK_ICON_SIZE = 16;

type ContactAddressPickerNetworkSectionProps = Readonly<{
  group: ContactAddressPickerNetworkGroup;
  onSelectAddress: ContactAddressPickerProps["onSelectAddress"];
}>;

export function ContactAddressPickerNetworkSection({
  group,
  onSelectAddress,
}: ContactAddressPickerNetworkSectionProps) {
  return (
    <Box testID={`pay-contact-address-group-${group.networkId}`} lx={{ gap: "s8" }}>
      <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8", paddingHorizontal: "s8" }}>
        <CryptoIcon
          ledgerId={group.networkId}
          ticker={group.networkTicker}
          size={NETWORK_ICON_SIZE}
          shape="square"
        />
        <Text typography="body2" lx={{ color: "muted" }}>
          {group.networkName}
        </Text>
      </Box>
      <Box lx={{ gap: "s8" }}>
        {group.rows.map(row => (
          <ContactAddressPickerRow
            key={row.addressId}
            row={row}
            onSelectAddress={onSelectAddress}
          />
        ))}
      </Box>
    </Box>
  );
}
