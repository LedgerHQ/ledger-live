import { useSyncExternalStore } from "react";

/**
 * DEMO-ONLY sidecar store mapping an address+chain pair to the crypto
 * the user picked when registering it.
 *
 * Why this exists
 * ---------------
 * `ContactEntry` in `~/renderer/contacts/types.ts` is frozen at the DMK
 * shape and has no `ticker` / `coinId` field. The L1 register-address
 * form lets the user pick a crypto (USDC, ETH, …) but we have nowhere
 * to put that selection in the canonical contact store. For the L4
 * designer demo we want the details pane to group by crypto rather
 * than by chain, which needs that information.
 *
 * Storage approach
 * ----------------
 * - `localStorage` keyed under `LLD_CONTACTS_CRYPTO_META_V1`.
 * - Composite key per entry:
 *   `${chainId}:${normalizedAddressLower}:${scope}`. The `scope` part
 *   (the per-entry user label) is what distinguishes two entries that
 *   reuse the same `(chainId, addressHex)` pair — e.g. the same EVM
 *   address registered once as ETH and once as USDT on Ethereum.
 *   Without it the keys collide and the latest write retroactively
 *   re-groups all existing entries at that address.
 * - Pure metadata — never round-trips to the device, never feeds any
 *   signing, never duplicates the canonical contact data (just the
 *   crypto-id annotation for grouping).
 *
 * Caveats
 * -------
 * - Strictly violates the "No second storage path" project rule in
 *   `apps/ledger-live-desktop/docs/contacts.md`. Acceptable for the
 *   demo because the data is cosmetic, but we should retire this the
 *   moment DMK ships a `ticker` / `coinId` field on ContactEntry.
 * - On schema migration, walk the sidecar once and write each entry
 *   into the canonical store, then `localStorage.removeItem(KEY)`.
 *
 * TODO(contacts-L4.1): retire once the canonical ContactEntry schema
 * grows a crypto field.
 */

const STORAGE_KEY = "LLD_CONTACTS_CRYPTO_META_V1";

type CryptoMetaSnapshot = Readonly<Record<string, string>>;

const normalize = (addressHex: string) =>
  (addressHex.startsWith("0x") ? addressHex.slice(2) : addressHex).toLowerCase();

const entryKey = (addressHex: string, chainId: number, scope: string) =>
  `${chainId}:${normalize(addressHex)}:${scope}`;

/**
 * Legacy 2-part key (`${chainId}:${normalizedAddress}`) used before the
 * `scope` discriminator was added. `getCryptoMeta` falls back to this
 * form when the new 3-part key returns nothing so historical entries
 * keep their crypto annotation across the schema bump.
 */
const legacyEntryKey = (addressHex: string, chainId: number) =>
  `${chainId}:${normalize(addressHex)}`;

const isBrowserEnv =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const readFromStorage = (): CryptoMetaSnapshot => {
  if (!isBrowserEnv) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
};

let snapshot: CryptoMetaSnapshot = readFromStorage();
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};

const writeAndEmit = (next: Record<string, string>) => {
  snapshot = next;
  if (isBrowserEnv) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Swallow quota / private-mode errors; the sidecar is best-effort.
    }
  }
  emit();
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): CryptoMetaSnapshot => snapshot;

/**
 * Read-only React hook returning the sidecar map. Re-renders the
 * consumer when any entry changes. Same `useSyncExternalStore`
 * pattern as `~/renderer/contacts/hooks.ts`.
 */
export const useCryptoMeta = (): CryptoMetaSnapshot =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

/**
 * Pure synchronous lookup (no subscription). Useful inside `.map`
 * iterations where the parent already subscribes via `useCryptoMeta`.
 *
 * Tries the new `chainId:address:scope` key first, then falls back to
 * the legacy `chainId:address` form so entries written before the
 * `scope` discriminator was added still resolve. New writes always
 * use the 3-part key, so the fallback only ever fires on legacy data.
 */
export const getCryptoMeta = (
  meta: CryptoMetaSnapshot,
  addressHex: string,
  chainId: number,
  scope: string,
): string | undefined =>
  meta[entryKey(addressHex, chainId, scope)] ??
  meta[legacyEntryKey(addressHex, chainId)];

/**
 * Read the live module snapshot directly. Useful inside event
 * handlers (e.g. the rename-address path in `useManagementViewModel`)
 * where we need a one-shot read of the current annotation without
 * subscribing through React.
 */
export const readCryptoMeta = (
  addressHex: string,
  chainId: number,
  scope: string,
): string | undefined => getCryptoMeta(snapshot, addressHex, chainId, scope);

/**
 * Persist a crypto-id annotation for the given entry. The key now
 * includes the entry's `scope` so two entries that share the same
 * `(chainId, addressHex)` (e.g. ETH and USDT registered at the same
 * EVM address) keep distinct annotations.
 *
 * Pass `undefined` to clear (e.g. when an address is edited or removed).
 */
export const setCryptoMeta = (
  addressHex: string,
  chainId: number,
  scope: string,
  cryptoId: string | undefined,
): void => {
  const key = entryKey(addressHex, chainId, scope);
  const next = { ...snapshot };
  if (cryptoId === undefined) {
    if (!(key in next)) return;
    delete next[key];
  } else {
    if (next[key] === cryptoId) return;
    next[key] = cryptoId;
  }
  writeAndEmit(next);
};
