import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { ContactDetailAddressNetworkGroup, ContactDetailAddressRowIntent } from "../../types";
import { ContactDetailAddressNetworkSection } from "../ContactDetailAddressNetworkSection/ContactDetailAddressNetworkSection.native";

type ContactDetailAddressListProps = Readonly<{
  addressGroups: readonly ContactDetailAddressNetworkGroup[];
  onAddressRowPress: (intent: ContactDetailAddressRowIntent) => void;
}>;

export function ContactDetailAddressList({
  addressGroups,
  onAddressRowPress,
}: ContactDetailAddressListProps): React.JSX.Element {
  return (
    <Box
      testID="contacts-detail-address-list"
      lx={{ gap: "s24", paddingHorizontal: "s16", paddingTop: "s32", paddingBottom: "s32" }}
    >
      {addressGroups.map(group => (
        <ContactDetailAddressNetworkSection
          key={group.networkId}
          group={group}
          onAddressRowPress={onAddressRowPress}
        />
      ))}
    </Box>
  );
}
