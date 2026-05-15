import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { contactsAlphaSelector } from "~/renderer/reducers/settings";
import { useContactsStore } from "~/renderer/contacts/hooks";
import type { ContactsWallet } from "~/renderer/contacts/types";
import type { ContactBadgeKind } from "~/renderer/contacts/ContactBadge";

const MAX_SUGGESTIONS = 5;

const normalizeAddress = (addressHex: string): string => {
  const trimmed = addressHex.trim().toLowerCase();
  return trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
};

const stripHexPrefix = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
};

const isHexPrefix = (value: string): boolean => {
  if (value.length === 0) return false;
  return /^[0-9a-f]+$/.test(value);
};

export type RecipientSuggestion = {
  id: string;
  name: string;
  /** 0x-prefixed, lowercased — ready for `recipientSearch.setValue`. */
  addressHex: string;
  kind: ContactBadgeKind;
  /** Per-entry label for external contacts (e.g. "main"); undefined for registered Ledger accounts. */
  scope?: string;
};

const ADDRESS_HEX_LENGTH = 40;

/**
 * Pure suggestion builder. Filters the Contacts wallet by chain + name/address
 * prefix and returns up to `MAX_SUGGESTIONS` rows. Ledger accounts take
 * precedence over external entries on the same address — same precedence as
 * the data source's `lookupTo` and the resolveContact helper.
 *
 * When the query is a fully-formed 40-char hex address that matches one of
 * the wallet entries exactly, no suggestions are returned — the user has
 * already typed/pasted the address (likely via a prior suggestion click) and
 * keeping the dropdown open would be redundant.
 */
export const buildRecipientSuggestions = (
  wallet: ContactsWallet,
  query: string,
  chainId: number,
): RecipientSuggestion[] => {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const nameNeedle = trimmed.toLowerCase();
  const addressNeedle = stripHexPrefix(trimmed);
  const matchAddress = isHexPrefix(addressNeedle);
  const queryIsFullAddress = matchAddress && addressNeedle.length === ADDRESS_HEX_LENGTH;

  const seenAddresses = new Set<string>();
  const out: RecipientSuggestion[] = [];

  // Ledger accounts first — they win on duplicate addresses.
  for (const account of Object.values(wallet.accounts)) {
    if (account.chainId !== chainId) continue;
    const storedNorm = normalizeAddress(account.addressHex);
    if (queryIsFullAddress && storedNorm === addressNeedle) return [];
    const matches =
      account.name.toLowerCase().startsWith(nameNeedle) ||
      (matchAddress && storedNorm.startsWith(addressNeedle));
    if (!matches) continue;
    if (seenAddresses.has(storedNorm)) continue;
    seenAddresses.add(storedNorm);
    out.push({
      id: `ledger:${account.name}`,
      name: account.name,
      addressHex: `0x${storedNorm}`,
      kind: "ledgerAccount",
    });
    if (out.length >= MAX_SUGGESTIONS) return out;
  }

  for (const contact of Object.values(wallet.contacts)) {
    for (const entry of contact.entries) {
      if (entry.chainId !== chainId) continue;
      const storedNorm = normalizeAddress(entry.addressHex);
      if (queryIsFullAddress && storedNorm === addressNeedle) return [];
      if (seenAddresses.has(storedNorm)) continue;
      const matches =
        contact.name.toLowerCase().startsWith(nameNeedle) ||
        (matchAddress && storedNorm.startsWith(addressNeedle));
      if (!matches) continue;
      seenAddresses.add(storedNorm);
      out.push({
        id: `external:${contact.name}#${storedNorm}`,
        name: contact.name,
        addressHex: `0x${storedNorm}`,
        kind: "external",
        scope: entry.scope,
      });
      if (out.length >= MAX_SUGGESTIONS) return out;
    }
  }

  return out;
};

export type UseRecipientSuggestions = {
  suggestions: RecipientSuggestion[];
};

export const useRecipientSuggestions = (
  query: string,
  chainId: number | undefined,
): UseRecipientSuggestions => {
  const contactsAlpha = useSelector(contactsAlphaSelector);
  const { wallet, hydrated } = useContactsStore();

  const suggestions = useMemo(() => {
    if (!contactsAlpha || !hydrated || chainId === undefined) return [];
    return buildRecipientSuggestions(wallet, query, chainId);
  }, [contactsAlpha, hydrated, wallet, query, chainId]);

  return { suggestions };
};
