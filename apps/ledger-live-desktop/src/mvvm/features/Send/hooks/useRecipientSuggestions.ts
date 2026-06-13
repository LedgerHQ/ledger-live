import { useMemo } from "react";
import { useContactsStore } from "~/renderer/contacts/hooks";
import type { ContactEntry, ContactsWallet } from "~/renderer/contacts/types";
import type { ContactBadgeKind } from "~/renderer/contacts/ContactBadge";
import { getCryptoMeta, useCryptoMeta } from "~/mvvm/features/Contacts/Management/utils/cryptoMeta";
import {
  getCryptoById,
  getNativeCryptoIdForChain,
} from "~/mvvm/features/Contacts/Management/utils/getCryptoById";

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

export type CryptoCompatibilityFilter = Readonly<{
  /**
   * Selected crypto's ticker (e.g. "ETH"). Entries whose resolved crypto
   * is a different asset on the same chain (e.g. a QNT address while
   * sending ETH) are dropped.
   */
  selectedTicker: string;
  /**
   * `cryptoMeta` sidecar snapshot — the per-entry crypto annotation set
   * when the address was registered. Pass `useCryptoMeta()`'s value so
   * updates re-trigger the filtering.
   */
  cryptoMeta: Readonly<Record<string, string>>;
}>;

/**
 * Does this entry's crypto match the selected one? Resolution mirrors the
 * Contacts details pane (`groupAddressesByCrypto`): sidecar annotation
 * first, then the chain's native gas token for legacy un-annotated
 * entries. Comparison is by TICKER, not ledger id — the chainId filter
 * already pins the network, and multichain tokens (USDT on Polygon vs
 * Ethereum) share a ticker but not a ledger id. Entries we can't resolve
 * to a known crypto are dropped (strict compatibility).
 */
const entryMatchesSelectedCrypto = (
  entry: ContactEntry,
  filter: CryptoCompatibilityFilter | undefined,
): boolean => {
  if (!filter) return true;
  const cryptoId =
    getCryptoMeta(filter.cryptoMeta, entry.addressHex, entry.chainId, entry.scope) ??
    getNativeCryptoIdForChain(entry.chainId);
  if (cryptoId === undefined) return false;
  const crypto = getCryptoById(cryptoId);
  if (!crypto) return false;
  return crypto.ticker.toUpperCase() === filter.selectedTicker.toUpperCase();
};

const matchesQuery = (query: string, addressKey: string, name: string): boolean => {
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
  /** When set, external entries must also match the selected crypto (same chain ≠ same asset). */
  cryptoFilter?: CryptoCompatibilityFilter,
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
      if (!entryMatchesSelectedCrypto(entry, cryptoFilter)) continue;
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
  /** Selected crypto's ticker — entries on the chain holding a DIFFERENT asset are dropped. */
  selectedTicker?: string,
): RecipientSuggestionGroups => {
  const { wallet, hydrated } = useContactsStore();
  const cryptoMeta = useCryptoMeta();

  return useMemo(() => {
    if (!hydrated || chainId === undefined) return EMPTY_GROUPS;
    return buildRecipientSuggestionGroups(
      wallet,
      query,
      chainId,
      selectedTicker ? { selectedTicker, cryptoMeta } : undefined,
    );
  }, [hydrated, wallet, query, chainId, selectedTicker, cryptoMeta]);
};
