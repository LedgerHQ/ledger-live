import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type { ContactDetailAddressNetworkGroup, ContactDetailAddressRowIntent } from "../../types";
import { ContactDetailAddressRow as ContactDetailAddressRowView } from "../ContactDetailAddressRow/ContactDetailAddressRow.web";

type ContactDetailAddressNetworkSectionProps = Readonly<{
  group: ContactDetailAddressNetworkGroup;
  onAddressRowPress: (intent: ContactDetailAddressRowIntent) => void;
}>;

export function ContactDetailAddressNetworkSection({
  group,
  onAddressRowPress,
}: ContactDetailAddressNetworkSectionProps): React.ReactNode {
  return (
    <section
      className="flex flex-col gap-8"
      data-testid={`contacts-detail-network-group-${group.networkId}`}
    >
      <div className="flex items-center gap-8 px-8">
        <CryptoIcon
          ledgerId={group.networkId}
          ticker={group.networkTicker}
          size={16}
          shape="square"
        />
        <p className="body-2 text-muted">{group.networkName}</p>
      </div>
      <div className="flex flex-col overflow-hidden rounded-lg">
        {group.rows.map(row => (
          <ContactDetailAddressRowView
            key={row.addressId}
            row={row}
            networkId={group.networkId}
            onPress={onAddressRowPress}
          />
        ))}
      </div>
    </section>
  );
}
