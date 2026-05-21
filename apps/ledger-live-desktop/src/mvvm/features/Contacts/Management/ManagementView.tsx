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
 * Layout (Figma frame 13802:2833):
 * - Full-height vertical stack inside the standard LWD `<Page>` shell.
 * - Top: Lumen `NavBar` with the page title and "Add contact" trailing
 *   Button.
 * - Body: a CSS grid with two columns — `0.75fr` (list pane) +
 *   `1fr` (details pane) — separated by a 16px gap. Both panes are
 *   rounded `bg-surface-transparent` panels; the list scrolls
 *   independently of the details.
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
      data-testid="contacts-management-page"
      // `bg-canvas` pins the page to the `--background-canvas` token so the
      // translucent `bg-surface-transparent` panes composite correctly
      // against the canvas, independent of which Page layout shell
      // (classic vs wallet 4.0) renders us. `pb-24` leaves a 24px gutter
      // between the bottom of the panes and the bottom of the app —
      // matches the Figma frame 13802:2833.
      className="flex flex-col gap-24 h-full min-h-0 bg-canvas pb-24"
    >
      <Header />
      <div
        className="grid flex-1 min-h-0 gap-16"
        style={{ gridTemplateColumns: "minmax(0, 0.75fr) minmax(0, 1fr)" }}
      >
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
