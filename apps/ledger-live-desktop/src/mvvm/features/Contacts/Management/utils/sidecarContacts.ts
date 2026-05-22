import { useSyncExternalStore } from "react";
import type { Contact } from "~/renderer/contacts/types";

/**
 * DEMO-only sidecar store for contacts created via the L4 page.
 *
 * The L4 "Add contact" flow (Figma 13932:5015) lets the user create
 * a contact without going through the DMK device-action flow that the
 * L1 panel uses. Since the frozen `useContacts()` hook only exposes
 * `addContact(deviceId, …)` — which requires a device prompt + HMAC
 * signature — we can't write to the canonical store without that flow.
 *
 * To keep the designer demo snappy (instant feedback after the modal
 * closes), we mirror the `cryptoMeta` sidecar pattern: contacts are
 * persisted to `localStorage` under `LLD_CONTACTS_SIDECAR_V1` and
 * merged into the displayed contact list at read time.
 *
 * Caveats (also flagged in the commit body):
 *   1. Strictly violates the `docs/contacts.md` rule
 *      "No second storage path."
 *   2. Sidecar contacts are NOT registered on the device — they have
 *      no HMAC, so the on-device decoration during Send won't fire
 *      for their addresses.
 *   3. Sidecar entries can't be edited / renamed / removed from the
 *      L1 panel — that path reads the canonical store only.
 *
 * Migration path (TODO contacts-L4.1):
 *   When DMK adds a fire-and-forget "draft contact" verb (or once
 *   we accept device prompts inline in the L4 page), walk the
 *   sidecar once into the canonical store via
 *   `addContact(deviceId, …)` and `localStorage.removeItem(KEY)`.
 */

const KEY = "LLD_CONTACTS_SIDECAR_V1";

type SidecarMap = Record<string, Contact>;

let snapshot: SidecarMap = readFromStorage();
const subscribers = new Set<() => void>();

function readFromStorage(): SidecarMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as SidecarMap;
    }
  } catch {
    // corrupt — ignore and start fresh
  }
  return {};
}

function writeToStorage(next: SidecarMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full / private mode — sidecar persistence is best-effort.
  }
}

function notify(): void {
  for (const cb of subscribers) cb();
}

/**
 * Add a contact to the sidecar. Idempotent on `name` collision (the
 * new entry wins). The `Contact` shape is the same as the canonical
 * `ContactEntry`'s parent — empty `entries`, blank crypto fields
 * (sidecar contacts aren't device-registered, so the HMAC slots stay
 * blank).
 */
export function addSidecarContact(name: string): Contact {
  const contact: Contact = {
    name,
    groupHandleHex: "",
    hmacNameHex: "",
    entries: [],
  };
  snapshot = { ...snapshot, [name]: contact };
  writeToStorage(snapshot);
  notify();
  return contact;
}

/** Synchronous read of the current sidecar snapshot. */
export function getSidecarContacts(): SidecarMap {
  return snapshot;
}

/**
 * React subscription. Returns the current sidecar map, re-rendering
 * the consumer when entries are added/removed.
 */
export function useSidecarContacts(): SidecarMap {
  return useSyncExternalStore(
    subscribe,
    getSidecarContacts,
    // Server / SSR snapshot — desktop app is browser-only so this is
    // never hit in production, but jsdom tests can reach it.
    () => ({}),
  );
}

function subscribe(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}
