import { useCallback, useMemo, useState } from "react";
import type { UseContacts } from "~/renderer/contacts/useContacts";
import type { Contact, ContactEntry } from "~/renderer/contacts/types";

const entryValue = (addressHex: string, chainId: number) => `${addressHex}#${chainId}`;

type SelectItem = { value: string; label: string };

export type UseContactEntryPicker = {
  contactItems: SelectItem[];
  entryItems: SelectItem[];
  contact: Contact | null;
  selectedEntry: ContactEntry | null;
  contactName: string | null;
  entryKey: string | null;
  selectContact: (value: string | null) => void;
  selectEntry: (value: string | null) => void;
  reset: () => void;
};

/**
 * Shared state machine for "pick a contact, then pick one of its address entries".
 * Used by EditAddressSection and EditAddressLabelSection — both forms need the
 * same two-step selection plus matching reset semantics on submit.
 */
export const useContactEntryPicker = (contacts: UseContacts): UseContactEntryPicker => {
  const [contactName, setContactName] = useState<string | null>(null);
  const [entryKey, setEntryKey] = useState<string | null>(null);

  const contactItems = useMemo(
    () => Object.values(contacts.wallet.contacts).map(c => ({ value: c.name, label: c.name })),
    [contacts.wallet.contacts],
  );

  const contact = contactName ? (contacts.wallet.contacts[contactName] ?? null) : null;

  const entryItems = useMemo(
    () =>
      (contact?.entries ?? []).map(e => ({
        value: entryValue(e.addressHex, e.chainId),
        label: e.scope,
      })),
    [contact],
  );

  const selectedEntry = useMemo(
    () => contact?.entries.find(e => entryValue(e.addressHex, e.chainId) === entryKey) ?? null,
    [contact, entryKey],
  );

  const selectContact = useCallback((value: string | null) => {
    setContactName(value);
    setEntryKey(null);
  }, []);

  const selectEntry = useCallback((value: string | null) => {
    setEntryKey(value);
  }, []);

  const reset = useCallback(() => {
    setContactName(null);
    setEntryKey(null);
  }, []);

  return {
    contactItems,
    entryItems,
    contact,
    selectedEntry,
    contactName,
    entryKey,
    selectContact,
    selectEntry,
    reset,
  };
};
