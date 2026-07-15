import React from "react";
import PageHeader from "LLD/components/PageHeader";
import { ContactsAddContactButton, ContactsMeItem } from "@features/flow-contacts";

export type ContactsViewProps = {
  title: string;
  addContactLabel: string;
  meName: string;
  meAddressCountLabel: string;
};

export function ContactsView({
  title,
  addContactLabel,
  meName,
  meAddressCountLabel,
}: Readonly<ContactsViewProps>) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-24" data-testid="contacts-page">
      <PageHeader title={title} trailing={<ContactsAddContactButton label={addContactLabel} />} />
      <ContactsMeItem name={meName} addressCountLabel={meAddressCountLabel} />
    </div>
  );
}
