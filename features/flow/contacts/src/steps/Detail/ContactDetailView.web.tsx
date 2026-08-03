import React from "react";
import type { ContactDetailViewProps } from "./types";
import { ContactDetailActions } from "./components/ContactDetailActions/ContactDetailActions.web";
import { ContactDetailAddressList } from "./components/ContactDetailAddressList/ContactDetailAddressList.web";
import { ContactDetailEmptyState } from "./components/ContactDetailEmptyState.web";
import { ContactDetailHeader } from "./components/ContactDetailHeader.web";

export function ContactDetailView({
  contact,
  labels,
  meAvatarSrc,
  onAddAddress,
  addressGroups,
  onAddressRowPress,
  detailActions,
}: ContactDetailViewProps): React.ReactNode {
  const hasPopulatedAddresses = addressGroups !== undefined && onAddressRowPress !== undefined;

  return (
    <div
      className="relative flex h-full flex-col gap-32 px-16 py-32"
      data-testid="contacts-detail-screen"
    >
      {detailActions ? <ContactDetailActions {...detailActions} /> : null}
      <ContactDetailHeader
        contact={contact}
        labels={labels}
        meAvatarSrc={meAvatarSrc}
        onAddAddress={onAddAddress}
      />
      {hasPopulatedAddresses ? (
        <ContactDetailAddressList
          addressGroups={addressGroups}
          onAddressRowPress={onAddressRowPress}
        />
      ) : (
        <ContactDetailEmptyState contact={contact} labels={labels} />
      )}
    </div>
  );
}
