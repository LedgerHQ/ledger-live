import React, { useState } from "react";
import type { DisplayContact } from "./utils/groupContacts";
import type { ContactGroup } from "./utils/groupContacts";
import { AddContactDialog } from "./components/AddContactDialog";
import { ContactDetails } from "./components/ContactDetails";
import { ContactList } from "./components/ContactList";
import { Header } from "./components/Header";

export type ManagementViewProps = {
  groups: ContactGroup[];
  searchQuery: string;
  selectedContactName: string;
  selectedContact: DisplayContact;
  selectedContactIsMe: boolean;
  /**
   * True when editing the selected contact must run through the
   * on-device change-name flow (≥1 address registered). False for
   * sidecar / synthesized rows that can be renamed locally.
   */
  selectedContactRequiresDeviceConfirm: boolean;
  takenContactNames: string[];
  onSearchQueryChange: (next: string) => void;
  onSelectContact: (name: string) => void;
  onAddContact: (name: string) => void;
  onRenameContact: (currentDisplayName: string, newName: string) => void;
  /**
   * Drop one address entry from a contact. Threaded through to
   * `ContactDetails` so the per-row Delete-address dialog can fire
   * the actual removal on confirm.
   */
  onDeleteAddress: (
    currentDisplayName: string,
    entry: { addressHex: string; chainId: number; scope: string },
  ) => Promise<void>;
  /**
   * Verb factory for the on-device rename of an address label.
   * Threaded through to `ContactDetails` and then to
   * `RenameAddressDialog`, which hands the returned closure to
   * `RunDeviceAction.run`.
   */
  onRenameAddressLabelOnDevice: (
    currentDisplayName: string,
    entry: { addressHex: string; chainId: number; scope: string },
    newScope: string,
  ) => (deviceId: string) => Promise<unknown>;
  /**
   * Verb factory for the on-device address edit. Threaded through
   * to `ContactDetails` and then to `EditAddressDialog`, which
   * hands the returned closure to `RunDeviceAction.run`.
   */
  onEditAddressOnDevice: (
    currentDisplayName: string,
    entry: { addressHex: string; chainId: number; scope: string },
    newAddressHex: string,
  ) => (deviceId: string) => Promise<unknown>;
  /**
   * Verb factory for renaming a canonical contact through the device.
   * The dialog passes the returned closure to `RunDeviceAction.run`.
   */
  onRenameContactOnDevice: (
    currentDisplayName: string,
    newName: string,
  ) => (deviceId: string) => Promise<void>;
  onDeleteContact: (displayName: string) => void;
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
  // `selectedContactName` (the raw selection state) is intentionally not
  // destructured here — the list highlight is driven off the resolved
  // `selectedContact.name` below so it stays in sync with the right pane
  // even for the materialized Me row. It remains on the props type since
  // the parent spreads the whole view-model.
  selectedContact,
  selectedContactIsMe,
  selectedContactRequiresDeviceConfirm,
  takenContactNames,
  onSearchQueryChange,
  onSelectContact,
  onAddContact,
  onRenameContact,
  onRenameContactOnDevice,
  onDeleteContact,
  onDeleteAddress,
  onRenameAddressLabelOnDevice,
  onEditAddressOnDevice,
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
          // Drive the list highlight off the RESOLVED selected contact's
          // name, not the raw `selectedContactName` state. On first load
          // the state is the literal `"me"` placeholder key, but the
          // pinned row may be a materialized Me (e.g. "Brian (Me)"). The
          // view-model resolves that to `selectedContact` via
          // `isMeIdentity`; matching the row against `selectedContact.name`
          // keeps the left-list highlight in sync with the right pane.
          // For every post-click selection the two are already identical.
          selectedContactName={selectedContact.name}
          onSearchQueryChange={onSearchQueryChange}
          onSelectContact={onSelectContact}
          // Share the AddContact dialog opener with the empty-state
          // CTA so the header button and the inline button land on
          // the same modal.
          onAddContact={() => setAddContactOpen(true)}
        />
        <ContactDetails
          contact={selectedContact}
          takenContactNames={takenContactNames}
          isMe={selectedContactIsMe}
          requiresDeviceConfirm={selectedContactRequiresDeviceConfirm}
          onRenameContact={onRenameContact}
          onRenameContactOnDevice={onRenameContactOnDevice}
          onDeleteContact={onDeleteContact}
          onDeleteAddress={onDeleteAddress}
          onRenameAddressLabelOnDevice={onRenameAddressLabelOnDevice}
          onEditAddressOnDevice={onEditAddressOnDevice}
        />
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
