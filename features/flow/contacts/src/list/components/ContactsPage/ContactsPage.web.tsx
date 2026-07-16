import React from "react";
import type { ContactsPageProps } from "../../types";
import { ContactsList } from "../ContactsList/ContactsList.web";
import { ContactsPageLayout } from "../ContactsPageLayout/ContactsPageLayout.web";

export function ContactsPage(props: ContactsPageProps): React.ReactNode {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-24 pb-32" data-testid="contacts-page">
      <ContactsPageLayout
        title={props.labels.title}
        addContactLabel={props.labels.addContact}
        onAddContact={props.onAddContact}
        list={<ContactsList {...props} />}
      />
    </div>
  );
}
