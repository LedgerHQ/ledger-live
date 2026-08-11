import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { ContactDetailViewProps } from "./types";
import { ContactDetailAddressList } from "./components/ContactDetailAddressList/ContactDetailAddressList.native";
import { ContactDetailEmptyState } from "./components/ContactDetailEmptyState.native";
import { ContactDetailHeader } from "./components/ContactDetailHeader.native";
import { LedgerWalletAddressesCard } from "./components/LedgerWalletAddressesCard.native";

export function ContactDetailView({
  contact,
  labels,
  meAvatarSrc,
  onAddAddress,
  onOpenLedgerWalletAddresses,
  addressGroups,
  onAddressRowPress,
}: ContactDetailViewProps): React.JSX.Element {
  const hasPopulatedAddresses = addressGroups !== undefined && onAddressRowPress !== undefined;

  return (
    <Box testID="contacts-detail-screen" lx={{ flex: 1, backgroundColor: "base" }}>
      <ContactDetailHeader
        contact={contact}
        labels={labels}
        meAvatarSrc={meAvatarSrc}
        onAddAddress={onAddAddress}
      />
      {contact.isMe && labels.ledgerWalletAddresses && onOpenLedgerWalletAddresses ? (
        <LedgerWalletAddressesCard
          label={labels.ledgerWalletAddresses}
          onPress={onOpenLedgerWalletAddresses}
        />
      ) : null}
      {hasPopulatedAddresses ? (
        <ContactDetailAddressList
          addressGroups={addressGroups}
          onAddressRowPress={onAddressRowPress}
        />
      ) : (
        <ContactDetailEmptyState contact={contact} labels={labels} />
      )}
    </Box>
  );
}
