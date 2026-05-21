import type { ContactEntry } from "~/renderer/contacts/types";
import {
  TOP_CRYPTOS,
  type CryptoOption,
} from "~/mvvm/features/Contacts/constants/topCryptos";
import { getCryptoMeta } from "./cryptoMeta";
import { getCryptoById, getNativeCryptoIdForChain } from "./getCryptoById";

/**
 * A bucket of address entries sharing the same crypto. Section header
 * uses `crypto.ticker` (e.g. "USDC"); the resolved CryptoOption gives
 * AddressRow the icon + ledgerId data it needs.
 */
export type CryptoAddressGroup = {
  cryptoId: string;
  crypto: CryptoOption;
  entries: ContactEntry[];
};

/**
 * Special bucket for entries we can't map to a top-50 crypto (e.g.
 * sidecar metadata referencing a pruned id, or a chainId we don't
 * have a native fallback for). Rendered last so the main groupings
 * stay clean.
 */
export type UnknownAddressGroup = {
  cryptoId: "unknown";
  entries: ContactEntry[];
};

export type AddressGroup = CryptoAddressGroup | UnknownAddressGroup;

/**
 * Resolve a ContactEntry to its `cryptoId`:
 *   1. The sidecar `cryptoMeta` set by the L1 form on registration.
 *   2. Otherwise the chain's native gas token (chainId → e.g. "ethereum").
 *   3. Otherwise undefined → caller drops into the "unknown" bucket.
 */
function resolveCryptoId(
  entry: ContactEntry,
  meta: Readonly<Record<string, string>>,
): string | undefined {
  return (
    getCryptoMeta(meta, entry.addressHex, entry.chainId) ??
    getNativeCryptoIdForChain(entry.chainId)
  );
}

/**
 * Group a contact's address entries by crypto, with the section
 * order matching the `TOP_CRYPTOS` order (market-cap descending).
 *
 * - Entries with sidecar metadata go into the matching crypto's bucket.
 * - Entries without metadata fall back to the chain's native gas
 *   token (so legacy entries still get a sensible grouping).
 * - Anything else lands in a single `unknown` bucket at the end.
 *
 * The `meta` snapshot is read with `getCryptoMeta` — the caller is
 * expected to have already subscribed to it via `useCryptoMeta()`
 * so updates re-trigger the grouping.
 */
export function groupAddressesByCrypto(
  entries: ContactEntry[],
  meta: Readonly<Record<string, string>>,
): AddressGroup[] {
  const byCryptoId = new Map<string, ContactEntry[]>();
  const unknown: ContactEntry[] = [];

  for (const entry of entries) {
    const cryptoId = resolveCryptoId(entry, meta);
    if (cryptoId === undefined || !getCryptoById(cryptoId)) {
      unknown.push(entry);
      continue;
    }
    const bucket = byCryptoId.get(cryptoId);
    if (bucket) bucket.push(entry);
    else byCryptoId.set(cryptoId, [entry]);
  }

  const groups: AddressGroup[] = [];
  // Iterate TOP_CRYPTOS so the section order matches the market-cap
  // ordering rather than the insertion order of the entries.
  for (const crypto of TOP_CRYPTOS) {
    const bucketEntries = byCryptoId.get(crypto.id);
    if (!bucketEntries) continue;
    groups.push({ cryptoId: crypto.id, crypto, entries: bucketEntries });
  }
  if (unknown.length > 0) {
    groups.push({ cryptoId: "unknown", entries: unknown });
  }
  return groups;
}
