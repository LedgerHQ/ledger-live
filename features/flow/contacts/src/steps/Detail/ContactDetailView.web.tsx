import React, { useEffect, useLayoutEffect, useState } from "react";
import type { ContactDetailViewProps } from "./types";
import { ContactDetailAddressList } from "./components/ContactDetailAddressList/ContactDetailAddressList.web";
import { ContactDetailEmptyState } from "./components/ContactDetailEmptyState.web";
import { ContactDetailHeader } from "./components/ContactDetailHeader/ContactDetailHeader.web";
import { LedgerWalletAddressesCard } from "./components/LedgerWalletAddressesCard.web";

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
  const [isContactSwitching, setIsContactSwitching] = useState(true);

  useLayoutEffect(() => {
    setIsContactSwitching(true);
    setIsHeaderCollapsed(false);
  }, [contact.id]);

  useEffect(() => {
    if (!isContactSwitching) return;
    const id = requestAnimationFrame(() => setIsContactSwitching(false));
    return () => cancelAnimationFrame(id);
  }, [isContactSwitching]);

  const hasCard = Boolean(
    ledgerWalletAccountsIntent && labels.ledgerWalletAddresses && onLedgerWalletAccountsPress,
  );

  const ledgerWalletCard = hasCard ? (
    <LedgerWalletAddressesCard
      label={labels.ledgerWalletAddresses!}
      intent={ledgerWalletAccountsIntent!}
      onPress={onLedgerWalletAccountsPress!}
    />
  ) : null;

  if (!hasPopulatedAddresses) {
    return (
      <div className="flex h-full flex-col gap-32 px-16 py-32" data-testid="contacts-detail-screen">
        <ContactDetailHeader
          contact={contact}
          labels={labels}
          meAvatarSrc={meAvatarSrc}
          onAddAddress={onAddAddress}
          detailActions={detailActions}
          isCollapsed={isHeaderCollapsed}
        />
        {ledgerWalletCard}
        <ContactDetailEmptyState contact={contact} labels={labels} />
      </div>
    );
  }

  const stickyBarSlideClass = isHeaderCollapsed
    ? "translate-y-0 motion-safe:transition-transform motion-safe:duration-[300ms] motion-safe:ease-out"
    : isContactSwitching
      ? "-translate-y-full"
      : "-translate-y-full motion-safe:transition-transform motion-safe:duration-[250ms] motion-safe:ease-in";

  const expandedHeader = (
    <div className="flex flex-col gap-32 px-16 py-32">
      <ContactDetailHeader
        contact={contact}
        labels={labels}
        meAvatarSrc={meAvatarSrc}
        onAddAddress={onAddAddress}
        detailActions={detailActions}
        isCollapsed={false}
      />
      {ledgerWalletCard}
    </div>
  );

  return (
    <div className="relative flex h-full min-h-0 flex-col" data-testid="contacts-detail-screen">
      <div
        data-testid="contacts-detail-sticky-bar"
        aria-hidden={!isHeaderCollapsed || undefined}
        inert={!isHeaderCollapsed}
        className={`absolute inset-x-0 top-0 z-10 bg-section/80 backdrop-blur-md motion-reduce:transition-none ${stickyBarSlideClass}`}
      >
        <ContactDetailHeader
          contact={contact}
          labels={labels}
          meAvatarSrc={meAvatarSrc}
          onAddAddress={onAddAddress}
          detailActions={detailActions}
          isCollapsed={true}
        />
      </div>

      <ContactDetailAddressList
        key={contact.id}
        addressGroups={addressGroups}
        onAddressRowPress={onAddressRowPress}
        onCollapseChange={setIsHeaderCollapsed}
        header={expandedHeader}
      />
    </div>
  );
}
