import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { ContactDetailAddressNetworkGroup, ContactDetailAddressRowIntent } from "../../types";
import { ContactDetailAddressRow as ContactDetailAddressRowView } from "../ContactDetailAddressRow/ContactDetailAddressRow.native";

type ContactDetailAddressNetworkSectionProps = Readonly<{
  group: ContactDetailAddressNetworkGroup;
  onAddressRowPress: (intent: ContactDetailAddressRowIntent) => void;
}>;

export function ContactDetailAddressNetworkSection({
  group,
  onAddressRowPress,
}: ContactDetailAddressNetworkSectionProps): React.JSX.Element {
  return (
    <Box testID={`contacts-detail-network-group-${group.networkId}`} lx={{ gap: "s8" }}>
      <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s8", paddingHorizontal: "s8" }}>
        <CryptoIcon
          ledgerId={group.networkId}
          ticker={group.networkTicker}
          size={16}
          shape="square"
        />
        <Text typography="body2" lx={{ color: "muted" }}>
          {group.networkName}
        </Text>
      </Box>
      <Box lx={{ gap: "s8" }}>
        {group.rows.map(row => (
          <ContactDetailAddressRowView
            key={row.addressId}
            row={row}
            networkId={group.networkId}
            onPress={onAddressRowPress}
          />
        ))}
      </Box>
    </Box>
  );
}
