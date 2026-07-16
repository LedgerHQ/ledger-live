import React, { type ReactNode } from "react";
import { ContactsDetailPane } from "./ContactsDetailPane.web";
import { ContactsHeader } from "./ContactsHeader.web";
import { ContactsListPane } from "./ContactsListPane.web";

type ContactsPageLayoutProps = Readonly<{
  title: string;
  addContactLabel: string;
  onAddContact: () => void;
  list: ReactNode;
  detail?: ReactNode;
}>;

export function ContactsPageLayout({
  title,
  addContactLabel,
  onAddContact,
  list,
  detail,
}: ContactsPageLayoutProps): React.ReactNode {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-32" data-testid="contacts-page-layout">
      <ContactsHeader title={title} addContactLabel={addContactLabel} onAddContact={onAddContact} />
      <div className="flex min-h-0 flex-1 gap-16">
        <ContactsListPane>{list}</ContactsListPane>
        <ContactsDetailPane>{detail}</ContactsDetailPane>
      </div>
    </div>
  );
}
