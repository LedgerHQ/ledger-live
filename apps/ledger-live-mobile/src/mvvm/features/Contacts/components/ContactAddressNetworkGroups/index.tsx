import React from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import {
  resolveContactAddressIconProps,
  truncateContactAddress,
  type ContactDetailAddressNetworkGroup,
  type ContactDetailAddressRow,
  type ContactDetailAddressRowIntent,
} from "@features/flow-contacts";

type ContactAddressNetworkGroupsProps = Readonly<{
  addressGroups: readonly ContactDetailAddressNetworkGroup[];
  onAddressRowPress: (intent: ContactDetailAddressRowIntent) => void;
  testIDPrefix: string;
}>;

function ContactAddressRow({
  row,
  networkId,
  testIDPrefix,
  onPress,
}: Readonly<{
  row: ContactDetailAddressRow;
  networkId: ContactDetailAddressNetworkGroup["networkId"];
  testIDPrefix: string;
  onPress: (intent: ContactDetailAddressRowIntent) => void;
}>) {
  const iconProps = resolveContactAddressIconProps(row.currencyId, row.label, networkId);

  return (
    <ListItem
      onPress={() => onPress(row.intent)}
      testID={`${testIDPrefix}-address-${row.addressId}`}
      accessibilityLabel={`${row.label}, ${row.address}`}
      lx={{ backgroundColor: "surface", borderRadius: "md" }}
    >
      <ListItemLeading>
        <CryptoIcon
          ledgerId={iconProps.ledgerId}
          ticker={iconProps.ticker}
          network={iconProps.network}
          size={48}
          shape="circle"
        />
        <ListItemContent>
          <ListItemTitle>{row.label}</ListItemTitle>
          <ListItemDescription>{truncateContactAddress(row.address)}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}

export function ContactAddressNetworkGroups({
  addressGroups,
  onAddressRowPress,
  testIDPrefix,
}: ContactAddressNetworkGroupsProps) {
  return (
    <Box lx={{ gap: "s24" }}>
      {addressGroups.map(group => (
        <Box
          key={group.networkId}
          testID={`${testIDPrefix}-network-group-${group.networkId}`}
          lx={{ gap: "s8" }}
        >
          <Box
            lx={{ flexDirection: "row", alignItems: "center", gap: "s8", paddingHorizontal: "s8" }}
          >
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
              <ContactAddressRow
                key={row.addressId}
                row={row}
                networkId={group.networkId}
                testIDPrefix={testIDPrefix}
                onPress={onAddressRowPress}
              />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
