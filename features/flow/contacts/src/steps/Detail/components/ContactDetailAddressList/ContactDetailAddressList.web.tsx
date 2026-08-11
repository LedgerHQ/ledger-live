import React from "react";
import type { ContactDetailAddressNetworkGroup, ContactDetailAddressRowIntent } from "../../types";
import { ContactDetailAddressNetworkSection } from "../ContactDetailAddressNetworkSection/ContactDetailAddressNetworkSection.web";

type ContactDetailAddressListProps = Readonly<{
  addressGroups: readonly ContactDetailAddressNetworkGroup[];
  onAddressRowPress: (intent: ContactDetailAddressRowIntent) => void;
}>;

export function ContactDetailAddressList({
  addressGroups,
  onAddressRowPress,
}: ContactDetailAddressListProps): React.ReactNode {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-24 overflow-y-auto"
      data-testid="contacts-detail-address-list"
    >
      {addressGroups.map(group => (
        <ContactDetailAddressNetworkSection
          key={group.networkId}
          group={group}
          onAddressRowPress={onAddressRowPress}
        />
      ))}
    </div>
  );
}
