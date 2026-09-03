import React from "react";
import { SectionHeader, SectionHeaderLeading, SectionHeaderTitle } from "@ledgerhq/lumen-ui-react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import type {
  ContactAddressPickerNetworkGroup,
  ContactAddressPickerProps,
} from "../../../../types";
import { ContactAddressPickerRow } from "../ContactAddressPickerRow/ContactAddressPickerRow.web";

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
    <section
      className="flex flex-col gap-8"
      data-testid={`pay-contact-address-group-${group.networkId}`}
    >
      <SectionHeader appearance="no-background">
        <SectionHeaderLeading>
          <CryptoIcon
            ledgerId={group.networkId}
            ticker={group.networkTicker}
            size={NETWORK_ICON_SIZE}
            shape="square"
          />
        </SectionHeaderLeading>
        <SectionHeaderTitle>{group.networkName}</SectionHeaderTitle>
      </SectionHeader>
      {group.rows.map(row => (
        <ContactAddressPickerRow key={row.addressId} row={row} onSelectAddress={onSelectAddress} />
      ))}
    </section>
  );
}
