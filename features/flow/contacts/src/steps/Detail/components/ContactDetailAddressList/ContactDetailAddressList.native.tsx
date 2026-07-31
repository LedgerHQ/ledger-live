import React from "react";
import { ScrollView } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type {
  ContactDetailAddressNetworkGroup,
  ContactDetailAddressRowIntent,
} from "../../types";
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
    <ScrollView
      testID="contacts-detail-address-list"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <Box lx={{ gap: "s24", paddingHorizontal: "s16", paddingTop: "s32", paddingBottom: "s32" }}>
        {addressGroups.map(group => (
          <ContactDetailAddressNetworkSection
            key={group.networkId}
            group={group}
            onAddressRowPress={onAddressRowPress}
          />
        ))}
      </Box>
    </ScrollView>
  );
}
