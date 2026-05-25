import { useCallback, useMemo, useState } from "react";
import { useContacts } from "~/renderer/contacts/useContacts";
import type { Contact } from "~/renderer/contacts/types";
import { groupContacts, ME_CONTACT_NAME, type ContactGroup } from "../utils/groupContacts";
import {
  addSidecarContact,
  useSidecarContacts,
} from "../utils/sidecarContacts";
import {
  markContactDeleted,
  setContactRename,
  useContactRenames,
  useDeletedContacts,
} from "../utils/sidecarOverrides";

export type ManagementViewModel = {
  groups: ContactGroup[];
  searchQuery: string;
  selectedContactName: string;
  selectedContact: Contact;
  /** Display names that are already taken — used by Add/Edit dialogs' duplicate checks. */
  takenContactNames: string[];
  onSearchQueryChange: (next: string) => void;
  onSelectContact: (name: string) => void;
  /**
   * Add a new (sidecar-backed) contact and auto-select it. Caller is
   * expected to have already validated the name via the dialog (we
   * still no-op on empties + duplicates here as a belt-and-braces).
   */
  onAddContact: (name: string) => void;
  /**
   * Rename a contact. Adds a `sidecarOverrides` rename entry mapping
   * the underlying name → display name and updates the selection to the
   * new display name. Works for both canonical and sidecar contacts —
   * the merged view always reads the rename overlay at render time.
   */
  onRenameContact: (currentDisplayName: string, newName: string) => void;
  /**
   * Delete a contact from the displayed list. Adds the underlying name
   * to the `sidecarOverrides` deleted set. Selection snaps back to "me"
   * (which always renders thanks to the synthesized placeholder).
   */
  onDeleteContact: (displayName: string) => void;
};

/**
 * Selection + search state for the Contacts management page.
 *
 * Reads:
 *   - `useContacts().wallet.contacts` — canonical DMK-backed map.
 *   - `useSidecarContacts()` — sidecar-only contacts created via the
 *     L4 "Add contact" Dialog.
 *   - `useContactRenames()` — `underlyingName → displayName` overlay.
 *   - `useDeletedContacts()` — names hidden from the view.
 *
 * Merge order: canonical first, sidecar last → sidecar wins on name
 * collision. Rename overlay is then applied, so every consumer sees
 * the post-rename display name. Deleted set filters at the end.
 *
 * `selectedContactName` lives in DISPLAY space (post-rename). When a
 * rename fires, we update it to the new value so the right pane
 * doesn't visually unselect.
 *
 * Same caveats as the other sidecars: strictly violates the
 * `docs/contacts.md` "no second storage path" rule; demo-only.
 */
export function useManagementViewModel(): ManagementViewModel {
  const { wallet } = useContacts();
  const sidecar = useSidecarContacts();
  const renames = useContactRenames();
  const deleted = useDeletedContacts();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactName, setSelectedContactName] =
    useState<string>(ME_CONTACT_NAME);

  // Canonical + sidecar merge. Apply renames → derive a final
  // `Record<displayName, Contact>` with each entry's `name` field
  // rewritten to the display name. Filter out deleted names AFTER
  // the rename (so deletion can target either the underlying or the
  // display name — both work because renames are applied first).
  const mergedContacts = useMemo<Record<string, Contact>>(() => {
    const out: Record<string, Contact> = {};
    const source = { ...wallet.contacts, ...sidecar };
    for (const [underlying, contact] of Object.entries(source)) {
      if (deleted[underlying]) continue;
      const displayName = renames[underlying] ?? underlying;
      if (deleted[displayName]) continue;
      out[displayName] = { ...contact, name: displayName };
    }
    return out;
  }, [wallet.contacts, sidecar, renames, deleted]);

  const groups = useMemo(
    () => groupContacts(mergedContacts, searchQuery),
    [mergedContacts, searchQuery],
  );

  const takenContactNames = useMemo(
    () => Object.values(mergedContacts).map(c => c.name),
    [mergedContacts],
  );

  // Resolve the selected contact off the FULL merged list (ignoring the
  // search filter) so the details pane never empties just because the
  // user's query trimmed the row from the list. Fall back to the "me"
  // placeholder for the (rare) case where the selected name has been
  // removed from the wallet between renders.
  const selectedContact = useMemo<Contact>(() => {
    const fromMerged = Object.values(mergedContacts).find(
      c => c.name === selectedContactName,
    );
    if (fromMerged) return fromMerged;
    const meFromMerged = Object.values(mergedContacts).find(
      c => c.name.trim().toLowerCase() === ME_CONTACT_NAME,
    );
    if (meFromMerged) return meFromMerged;
    return {
      name: ME_CONTACT_NAME,
      groupHandleHex: "",
      hmacNameHex: "",
      entries: [],
    };
  }, [mergedContacts, selectedContactName]);

  const onAddContact = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      // Defensive duplicate guard — the dialog already blocks this.
      if (Object.values(mergedContacts).some(c => c.name === trimmed)) return;
      addSidecarContact(trimmed);
      setSelectedContactName(trimmed);
    },
    [mergedContacts],
  );

  const onRenameContact = useCallback(
    (currentDisplayName: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed || trimmed === currentDisplayName) return;
      // Resolve the underlying name (pre-rename) for the override key.
      // `currentDisplayName` IS the display name; find the underlying
      // that maps to it — either directly (no prior rename) or via the
      // existing renames map.
      const underlying =
        Object.entries(renames).find(([, dn]) => dn === currentDisplayName)?.[0] ??
        currentDisplayName;
      setContactRename(underlying, trimmed);
      // Snap selection to the new display name so the right pane
      // doesn't unselect.
      setSelectedContactName(trimmed);
    },
    [renames],
  );

  const onDeleteContact = useCallback(
    (displayName: string) => {
      // Mark BOTH the underlying name and the current display name as
      // deleted, so the filter catches it regardless of which side of
      // the rename overlay the row is using.
      const underlying =
        Object.entries(renames).find(([, dn]) => dn === displayName)?.[0] ??
        displayName;
      markContactDeleted(underlying);
      if (underlying !== displayName) markContactDeleted(displayName);
      // Snap selection back to "me" (always available via the
      // synthesized placeholder).
      setSelectedContactName(ME_CONTACT_NAME);
    },
    [renames],
  );

  return {
    groups,
    searchQuery,
    selectedContactName,
    selectedContact,
    takenContactNames,
    onSearchQueryChange: setSearchQuery,
    onSelectContact: setSelectedContactName,
    onAddContact,
    onRenameContact,
    onDeleteContact,
  };
}
