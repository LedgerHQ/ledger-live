import React from "react";
import type { ContactDetailViewProps } from "./types";
import { ContactDetailEmptyState } from "./components/ContactDetailEmptyState.web";
import { ContactDetailHeader } from "./components/ContactDetailHeader.web";

export function ContactDetailView({
  contact,
  labels,
  meAvatarSrc,
  onAddAddress,
}: ContactDetailViewProps): React.ReactNode {
  return (
    <div className="flex h-full flex-col" data-testid="contacts-detail-screen">
      <ContactDetailHeader
        contact={contact}
        labels={labels}
        meAvatarSrc={meAvatarSrc}
        onAddAddress={onAddAddress}
      />
      <ContactDetailEmptyState contact={contact} labels={labels} />
    </div>
  );
}
