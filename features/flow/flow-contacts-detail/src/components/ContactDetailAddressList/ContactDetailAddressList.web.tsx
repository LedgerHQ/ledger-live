import React from "react";
import type { ContactDetailAddressNetworkGroup, ContactDetailAddressRowIntent } from "../../types";
import { ContactDetailAddressNetworkSection } from "../ContactDetailAddressNetworkSection/ContactDetailAddressNetworkSection.web";

type ContactDetailAddressListProps = Readonly<{
  addressGroups: readonly ContactDetailAddressNetworkGroup[];
  onAddressRowPress: (intent: ContactDetailAddressRowIntent) => void;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
}>;

export function ContactDetailAddressList({
  addressGroups,
  onAddressRowPress,
  onScroll,
}: ContactDetailAddressListProps): React.ReactNode {
  return (
    <div
      className="scrollbar-custom flex min-h-0 flex-1 flex-col gap-24 overflow-y-auto [scrollbar-gutter:auto]"
      data-testid="contacts-detail-address-list"
      onScroll={onScroll}
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
