import { useSyncExternalStore } from "react";

/**
 * DEMO-ONLY sidecar store mapping a contact name to the picture the
 * user uploaded for it (a `data:` URL).
 *
 * Why this exists
 * ---------------
 * `Contact` in `~/renderer/contacts/types.ts` is frozen at the DMK
 * shape and has no avatar/photo field. The Add-contact dialog (Figma
 * 14369:13296) lets the user attach an optional picture, but there is
 * nowhere to put it in the canonical contact store.
 *
 * Storage approach
 * ----------------
 * - `localStorage` keyed under `LLD_CONTACTS_PHOTO_V1`.
 * - One key per contact: the contact's wallet key (= display name).
 * - Value: the picture as a base64 `data:image/...` URL. Uploads are
 *   capped at 2MB by the dialog, so a single photo tops out around
 *   ~2.7MB encoded — fine for a demo, but the reason this must not
 *   grow into a long-term storage path.
 * - Pure cosmetics — never round-trips to the device, never feeds any
 *   signing.
 *
 * Caveats
 * -------
 * - Strictly violates the "No second storage path" project rule in
 *   `apps/ledger-live-desktop/docs/contacts.md`. Acceptable for the
 *   demo because the data is cosmetic — same waiver as `cryptoMeta`.
 * - Keys follow the contact's name, so every rename path must call
 *   `renameContactPhoto` and every delete path `setContactPhoto(name,
 *   undefined)` (see `useManagementViewModel`).
 *
 * TODO(contacts-L4.1): retire once contacts get a real avatar slot
 * (DMK schema or app-level profile store).
 */

const STORAGE_KEY = "LLD_CONTACTS_PHOTO_V1";

type ContactPhotoSnapshot = Readonly<Record<string, string>>;

const isBrowserEnv =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const readFromStorage = (): ContactPhotoSnapshot => {
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

let snapshot: ContactPhotoSnapshot = readFromStorage();
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

const getSnapshot = (): ContactPhotoSnapshot => snapshot;

/**
 * Read-only React hook returning the photo map. Re-renders the
 * consumer when any entry changes. Same `useSyncExternalStore`
 * pattern as `cryptoMeta.ts`.
 */
export const useContactPhotos = (): ContactPhotoSnapshot =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

/** Pure synchronous lookup (no subscription). */
export const getContactPhoto = (
  photos: ContactPhotoSnapshot,
  contactName: string,
): string | undefined => photos[contactName];

/**
 * Persist (or clear, with `undefined`) the photo for a contact.
 */
export const setContactPhoto = (contactName: string, dataUrl: string | undefined): void => {
  const next = { ...snapshot };
  if (dataUrl === undefined) {
    if (!(contactName in next)) return;
    delete next[contactName];
  } else {
    if (next[contactName] === dataUrl) return;
    next[contactName] = dataUrl;
  }
  writeAndEmit(next);
};

/**
 * Move a photo across a rename. The store is keyed by contact name (=
 * the wallet key), so both the local and the on-device rename paths
 * must re-key or the photo silently detaches from the contact.
 * No-op when the names match or the old name has no photo.
 */
export const renameContactPhoto = (oldName: string, newName: string): void => {
  if (oldName === newName) return;
  const existing = snapshot[oldName];
  if (existing === undefined) return;
  const next = { ...snapshot };
  delete next[oldName];
  next[newName] = existing;
  writeAndEmit(next);
};
