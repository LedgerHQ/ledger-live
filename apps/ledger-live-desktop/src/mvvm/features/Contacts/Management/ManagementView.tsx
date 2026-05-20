import React from "react";
import type { Contact } from "~/renderer/contacts/types";
import type { ContactGroup } from "./utils/groupContacts";
import { ContactDetails } from "./components/ContactDetails";
import { ContactList } from "./components/ContactList";
import { Header } from "./components/Header";

export type ManagementViewProps = {
  groups: ContactGroup[];
  searchQuery: string;
  selectedContactName: string;
  selectedContact: Contact;
  onSearchQueryChange: (next: string) => void;
  onSelectContact: (name: string) => void;
};

/**
 * Pure view for the Contacts management page.
 *
 * Layout: full-height column with a header strip on top, then a flex row
 * that splits into the contact list (LEFT, fixed-ish width) and the
 * details pane (RIGHT, flex-1). The route is registered at top-level in
 * `Default.tsx`, so the page renders inside the standard LWD `<Page>`
 * shell — no extra chrome here.
 */
export function ManagementView({
  groups,
  searchQuery,
  selectedContactName,
  selectedContact,
  onSearchQueryChange,
  onSelectContact,
}: ManagementViewProps) {
  return (
    <div
      className="flex flex-col h-full min-h-0"
      data-testid="contacts-management-page"
    >
      <Header />
      <div className="flex flex-1 min-h-0">
        <ContactList
          groups={groups}
          searchQuery={searchQuery}
          selectedContactName={selectedContactName}
          onSearchQueryChange={onSearchQueryChange}
          onSelectContact={onSelectContact}
        />
        <ContactDetails contact={selectedContact} />
      </div>
    </div>
  );
}
