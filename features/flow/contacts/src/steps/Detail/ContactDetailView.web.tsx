import React, { useCallback, useEffect, useState } from "react";
import type { ContactDetailViewProps } from "./types";
import { ContactDetailAddressList } from "./components/ContactDetailAddressList/ContactDetailAddressList.web";
import { ContactDetailEmptyState } from "./components/ContactDetailEmptyState.web";
import { ContactDetailHeader } from "./components/ContactDetailHeader/ContactDetailHeader.web";
import { LedgerWalletAddressesCard } from "./components/LedgerWalletAddressesCard.web";

const COMPACT_HEADER_SCROLL_OFFSET = 150;

export function ContactDetailView({
  contact,
  labels,
  meAvatarSrc,
  onAddAddress,
  ledgerWalletAccountsIntent,
  onLedgerWalletAccountsPress,
  addressGroups,
  onAddressRowPress,
  detailActions,
}: ContactDetailViewProps): React.ReactNode {
  const hasPopulatedAddresses = addressGroups !== undefined && onAddressRowPress !== undefined;
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  const handleAddressListScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const shouldCollapseHeader = event.currentTarget.scrollTop > COMPACT_HEADER_SCROLL_OFFSET;
    setIsHeaderCollapsed(isCollapsed =>
      isCollapsed === shouldCollapseHeader ? isCollapsed : shouldCollapseHeader,
    );
  }, []);

  useEffect(() => {
    setIsHeaderCollapsed(false);
  }, [contact.id]);

  return (
    <div
      className={`relative flex h-full flex-col px-16 motion-safe:transition-[gap,padding] motion-safe:duration-[400ms] motion-safe:ease-in-out motion-reduce:transition-none ${
        isHeaderCollapsed ? "gap-0 pb-16 pt-0" : "gap-32 py-32"
      }`}
      data-testid="contacts-detail-screen"
    >
      <ContactDetailHeader
        contact={contact}
        labels={labels}
        meAvatarSrc={meAvatarSrc}
        onAddAddress={onAddAddress}
        detailActions={detailActions}
        isCollapsed={isHeaderCollapsed}
      />
      {ledgerWalletAccountsIntent && labels.ledgerWalletAddresses && onLedgerWalletAccountsPress ? (
        <LedgerWalletAddressesCard
          label={labels.ledgerWalletAddresses}
          intent={ledgerWalletAccountsIntent}
          onPress={onLedgerWalletAccountsPress}
        />
      ) : null}
      {hasPopulatedAddresses ? (
        <ContactDetailAddressList
          key={contact.id}
          addressGroups={addressGroups}
          onAddressRowPress={onAddressRowPress}
          onScroll={handleAddressListScroll}
        />
      ) : (
        <ContactDetailEmptyState contact={contact} labels={labels} />
      )}
    </div>
  );
}
