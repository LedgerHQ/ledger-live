import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { contactsAlphaSelector } from "~/renderer/reducers/settings";
import { useContactsStore } from "~/renderer/contacts/hooks";
import type { ContactsWallet } from "~/renderer/contacts/types";
import type { ContactBadgeKind } from "~/renderer/contacts/ContactBadge";

const ADDRESS_HEX_LENGTH = 40;

const normalizeAddress = (addressHex: string): string => {
  const trimmed = addressHex.trim().toLowerCase();
  return trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
};

const stripHexPrefix = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  return trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
};

const isHex = (value: string): boolean => value.length > 0 && /^[0-9a-f]+$/.test(value);

export type RecipientSuggestion = {
  id: string;
  name: string;
  /** 0x-prefixed, lowercased — ready for `recipientSearch.setValue`. */
  addressHex: string;
  /** Hex without prefix, lowercased — useful for `data-testid` and dedup. */
  addressKey: string;
  kind: ContactBadgeKind;
  /** Per-entry label for external contacts (e.g. "main"); undefined for registered Ledger accounts. */
  scope?: string;
};

export type RecipientSuggestionGroups = {
  /** Registered Ledger accounts on the active chain (filtered when `hasQuery`). */
  ledgerAccounts: RecipientSuggestion[];
  /** External address-book entries on the active chain (filtered when `hasQuery`). */
  external: RecipientSuggestion[];
  /** True when the user has typed something — drives section visibility decisions in the view. */
  hasQuery: boolean;
};

const EMPTY_GROUPS: RecipientSuggestionGroups = {
  ledgerAccounts: [],
  external: [],
  hasQuery: false,
};

const matchesQuery = (
  query: string,
  addressKey: string,
  name: string,
): boolean => {
  if (query.length === 0) return true;
  const nameNeedle = query.toLowerCase();
  const addressNeedle = stripHexPrefix(query);
  const matchAddress = isHex(addressNeedle);
  return (
    name.toLowerCase().startsWith(nameNeedle) ||
    (matchAddress && addressKey.startsWith(addressNeedle))
  );
};

/**
 * Pure grouped builder. Returns the wallet's Ledger accounts and address-book
 * entries on `chainId`, optionally narrowed by a name/address-prefix query.
 *
 * Ledger accounts take precedence over external entries on the same address —
 * same precedence as `lookupTo` in `contactsDataSource` and `resolveContact`.
 *
 * When the query is a fully-formed 40-char hex that matches a stored entry
 * exactly, both groups come back empty: the user has already nailed the
 * address (typically via picking a suggestion) and the picker should fold
 * back so the rest of the screen reflows.
 */
export const buildRecipientSuggestionGroups = (
  wallet: ContactsWallet,
  query: string,
  chainId: number,
): RecipientSuggestionGroups => {
  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;

  // Full-address self-hide: if the query is a 40-char hex matching any entry, fold the picker.
  if (hasQuery) {
    const queryAddressKey = stripHexPrefix(trimmed);
    if (isHex(queryAddressKey) && queryAddressKey.length === ADDRESS_HEX_LENGTH) {
      const allAddresses = new Set<string>();
      for (const a of Object.values(wallet.accounts)) {
        if (a.chainId === chainId) allAddresses.add(normalizeAddress(a.addressHex));
      }
      for (const c of Object.values(wallet.contacts)) {
        for (const e of c.entries) {
          if (e.chainId === chainId) allAddresses.add(normalizeAddress(e.addressHex));
        }
      }
      if (allAddresses.has(queryAddressKey)) {
        return { ledgerAccounts: [], external: [], hasQuery };
      }
    }
  }

  const seenAddresses = new Set<string>();
  const ledgerAccounts: RecipientSuggestion[] = [];

  for (const account of Object.values(wallet.accounts)) {
    if (account.chainId !== chainId) continue;
    const addressKey = normalizeAddress(account.addressHex);
    if (!matchesQuery(trimmed, addressKey, account.name)) continue;
    if (seenAddresses.has(addressKey)) continue;
    seenAddresses.add(addressKey);
    ledgerAccounts.push({
      id: `ledger:${account.name}`,
      name: account.name,
      addressHex: `0x${addressKey}`,
      addressKey,
      kind: "ledgerAccount",
    });
  }

  const external: RecipientSuggestion[] = [];
  for (const contact of Object.values(wallet.contacts)) {
    for (const entry of contact.entries) {
      if (entry.chainId !== chainId) continue;
      const addressKey = normalizeAddress(entry.addressHex);
      if (seenAddresses.has(addressKey)) continue;
      if (!matchesQuery(trimmed, addressKey, contact.name)) continue;
      seenAddresses.add(addressKey);
      external.push({
        id: `external:${contact.name}#${addressKey}`,
        name: contact.name,
        addressHex: `0x${addressKey}`,
        addressKey,
        kind: "external",
        scope: entry.scope,
      });
    }
  }

  return { ledgerAccounts, external, hasQuery };
};

export const useRecipientSuggestions = (
  query: string,
  chainId: number | undefined,
): RecipientSuggestionGroups => {
  const contactsAlpha = useSelector(contactsAlphaSelector);
  const { wallet, hydrated } = useContactsStore();

  return useMemo(() => {
    if (!contactsAlpha || !hydrated || chainId === undefined) return EMPTY_GROUPS;
    return buildRecipientSuggestionGroups(wallet, query, chainId);
  }, [contactsAlpha, hydrated, wallet, query, chainId]);
};
