import { useCallback, useMemo, useState } from "react";
import { useContacts } from "~/renderer/contacts/useContacts";
import type { Contact } from "~/renderer/contacts/types";
import { groupContacts, ME_CONTACT_NAME, type ContactGroup } from "../utils/groupContacts";
import {
  addSidecarContact,
  useSidecarContacts,
} from "../utils/sidecarContacts";

export type ManagementViewModel = {
  groups: ContactGroup[];
  searchQuery: string;
  selectedContactName: string;
  selectedContact: Contact;
  /** Names that are already taken — used by AddContactDialog's duplicate check. */
  takenContactNames: string[];
  onSearchQueryChange: (next: string) => void;
  onSelectContact: (name: string) => void;
  /**
   * Add a new (sidecar-backed) contact and auto-select it. Caller is
   * expected to have already validated the name via the dialog (we
   * still no-op on empties + duplicates here as a belt-and-braces).
   */
  onAddContact: (name: string) => void;
};

/**
 * Selection + search state for the Contacts management page.
 *
 * Reads the canonical wallet snapshot via the frozen `useContacts()`
 * boundary AND the DEMO-only sidecar via `useSidecarContacts()`. The
 * two are merged at read time — sidecar wins on name collision so a
 * later-created sidecar entry shadows a canonical contact with the
 * same name (in practice the AddContactDialog blocks duplicates so
 * this is defensive).
 *
 * See `utils/sidecarContacts.ts` for the caveats about the sidecar
 * being a strict violation of the "no second storage path" rule.
 */
export function useManagementViewModel(): ManagementViewModel {
  const { wallet } = useContacts();
  const sidecar = useSidecarContacts();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactName, setSelectedContactName] =
    useState<string>(ME_CONTACT_NAME);

  // Merged view of canonical + sidecar contacts. Canonical first so
  // sidecar entries with the same name override (matches our duplicate
  // check policy: the dialog blocks creation of a name that already
  // exists on either side, so this only matters defensively).
  const mergedContacts = useMemo(
    () => ({ ...wallet.contacts, ...sidecar }),
    [wallet.contacts, sidecar],
  );

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

  return {
    groups,
    searchQuery,
    selectedContactName,
    selectedContact,
    takenContactNames,
    onSearchQueryChange: setSearchQuery,
    onSelectContact: setSelectedContactName,
    onAddContact,
  };
}
