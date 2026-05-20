import { useMemo, useState } from "react";
import { useContacts } from "~/renderer/contacts/useContacts";
import type { Contact } from "~/renderer/contacts/types";
import { groupContacts, ME_CONTACT_NAME, type ContactGroup } from "../utils/groupContacts";

export type ManagementViewModel = {
  groups: ContactGroup[];
  searchQuery: string;
  selectedContactName: string;
  selectedContact: Contact;
  onSearchQueryChange: (next: string) => void;
  onSelectContact: (name: string) => void;
};

/**
 * Selection + search state for the Contacts management page.
 *
 * Reads the wallet snapshot via the frozen `useContacts()` boundary —
 * never touches DMK / storage directly, never imports from
 * `~/renderer/contacts/storage` or `~/renderer/contacts/types` (other than
 * the type-only `Contact` import). All derived data is `useMemo`d off the
 * wallet snapshot reference, which `useSyncExternalStore` keeps stable
 * across no-op updates.
 */
export function useManagementViewModel(): ManagementViewModel {
  const { wallet } = useContacts();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactName, setSelectedContactName] =
    useState<string>(ME_CONTACT_NAME);

  const groups = useMemo(
    () => groupContacts(wallet.contacts, searchQuery),
    [wallet.contacts, searchQuery],
  );

  // Resolve the selected contact off the FULL list (ignoring the search
  // filter) so the details pane never empties just because the user's
  // query trimmed the row from the list. Fall back to the "me" placeholder
  // for the (rare) case where the selected name has been removed from
  // the wallet between renders.
  const selectedContact = useMemo<Contact>(() => {
    const fromWallet = Object.values(wallet.contacts).find(
      c => c.name === selectedContactName,
    );
    if (fromWallet) return fromWallet;
    // The "me" placeholder is always available; if any other selection
    // disappears, snap back to it.
    const meFromWallet = Object.values(wallet.contacts).find(
      c => c.name.trim().toLowerCase() === ME_CONTACT_NAME,
    );
    if (meFromWallet) return meFromWallet;
    return {
      name: ME_CONTACT_NAME,
      groupHandleHex: "",
      hmacNameHex: "",
      entries: [],
    };
  }, [wallet.contacts, selectedContactName]);

  return {
    groups,
    searchQuery,
    selectedContactName,
    selectedContact,
    onSearchQueryChange: setSearchQuery,
    onSelectContact: setSelectedContactName,
  };
}
