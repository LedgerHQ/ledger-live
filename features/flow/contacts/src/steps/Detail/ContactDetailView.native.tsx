import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { ContactDetailViewProps } from "./types";
import { ContactDetailEmptyState } from "./components/ContactDetailEmptyState.native";
import { ContactDetailHeader } from "./components/ContactDetailHeader.native";
import { LedgerWalletAddressesCard } from "./components/LedgerWalletAddressesCard.native";

export function ContactDetailView({
  contact,
  labels,
  meAvatarSrc,
  onAddAddress,
  onOpenLedgerWalletAddresses,
}: ContactDetailViewProps): React.JSX.Element {
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
      <ContactDetailEmptyState contact={contact} labels={labels} />
    </Box>
  );
}
