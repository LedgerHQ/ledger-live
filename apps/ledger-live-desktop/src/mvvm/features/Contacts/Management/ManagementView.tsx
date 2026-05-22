import React, { useState } from "react";
import type { Contact } from "~/renderer/contacts/types";
import type { ContactGroup } from "./utils/groupContacts";
import { AddContactDialog } from "./components/AddContactDialog";
import { ContactDetails } from "./components/ContactDetails";
import { ContactList } from "./components/ContactList";
import { Header } from "./components/Header";

export type ManagementViewProps = {
  groups: ContactGroup[];
  searchQuery: string;
  selectedContactName: string;
  selectedContact: Contact;
  takenContactNames: string[];
  onSearchQueryChange: (next: string) => void;
  onSelectContact: (name: string) => void;
  onAddContact: (name: string) => void;
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
 *   rounded `bg-surface` panels; the list scrolls independently of
 *   the details.
 *
 * Dialog state for "Add contact" (Figma 13932:5015 / 13932:7803) lives
 * here at the view layer rather than in the viewModel — the view-model
 * owns the contact data + creation handler; the open/close flag is
 * pure UI.
 */
export function ManagementView({
  groups,
  searchQuery,
  selectedContactName,
  selectedContact,
  takenContactNames,
  onSearchQueryChange,
  onSelectContact,
  onAddContact,
}: ManagementViewProps) {
  const [addContactOpen, setAddContactOpen] = useState(false);

  const handleSubmitNewContact = (name: string) => {
    // Order matters: close the dialog first so its close transition
    // plays in parallel with the list re-render. The viewModel's
    // `onAddContact` writes to the sidecar AND auto-selects the new
    // contact, so the right pane shifts to the empty state on the
    // next commit.
    setAddContactOpen(false);
    onAddContact(name);
  };

  return (
    <div
      data-testid="contacts-management-page"
      // The page is registered in `mvvm/components/Page/utils.ts`'s
      // `WALLET_40_PAGES` set, so the app shell in `Default.tsx` applies
      // `bg-canvas` (the `--background-canvas` token) at the topmost
      // layout level — sidebar, top-bar, and content area share the
      // canvas background. We only need to handle the bottom gutter
      // here: `pb-32` leaves a 32px gap between the panes and the
      // bottom of the app, matching the Figma frame 13802:2833.
      className="flex flex-col gap-24 h-full min-h-0 pb-32"
    >
      <Header onAddContact={() => setAddContactOpen(true)} />
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

      <AddContactDialog
        open={addContactOpen}
        onOpenChange={setAddContactOpen}
        onSubmit={handleSubmitNewContact}
        takenNames={takenContactNames}
      />
    </div>
  );
}
