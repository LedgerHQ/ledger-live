import { useSyncExternalStore } from "react";

/**
 * DEMO-only sidecar overrides for the L4 contact CRUD actions.
 *
 * Two parallel stores in `localStorage`:
 *   - `LLD_CONTACTS_DELETED_V1` — names hidden from the merged view.
 *     A contact is "deleted" by adding its key here; the viewmodel
 *     filters them out of the displayed list. Works for both
 *     canonical (DMK-backed) contacts and our sidecar contacts —
 *     same caveat applies (UI-only; the canonical entry still
 *     lives on-device).
 *   - `LLD_CONTACTS_RENAMES_V1` — `oldName → newName` map. Applied
 *     at read time in the viewmodel: each merged contact's `name`
 *     is replaced with its renamed value (if any). Both canonical
 *     and sidecar contacts use this same overlay so the code path
 *     is uniform; no in-place mutation of the sidecar map needed.
 *
 * Same caveats / `TODO(contacts-L4.1)` framing as `cryptoMeta` and
 * `sidecarContacts`:
 *   1. Strict violation of the `docs/contacts.md`
 *      "No second storage path" rule. Demo-only.
 *   2. Wire-up paths once DMK ships:
 *      - delete  → useContacts().removeContact(deviceId, …)
 *                  (verb doesn't exist yet)
 *      - rename  → useContacts().renameContact(deviceId, {oldName, newName})
 *
 * Selection note: the renames overlay maps `oldName → newName`. The
 * viewmodel keeps `selectedContactName` in DISPLAY space (post-rename),
 * so consumers that look up a contact by name resolve against the
 * already-renamed merged view. When a rename fires, the viewmodel
 * updates `selectedContactName` to match the new value.
 */

const DELETED_KEY = "LLD_CONTACTS_DELETED_V1";
const RENAMES_KEY = "LLD_CONTACTS_RENAMES_V1";

type DeletedMap = Record<string, true>;
type RenamesMap = Record<string, string>;

let deletedSnapshot: DeletedMap = readDeletedFromStorage();
let renamesSnapshot: RenamesMap = readRenamesFromStorage();

const deletedSubscribers = new Set<() => void>();
const renamesSubscribers = new Set<() => void>();

function readDeletedFromStorage(): DeletedMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DELETED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as DeletedMap;
    }
  } catch {
    // corrupt — ignore
  }
  return {};
}

function readRenamesFromStorage(): RenamesMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(RENAMES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as RenamesMap;
    }
  } catch {
    // corrupt — ignore
  }
  return {};
}

function writeDeletedToStorage(next: DeletedMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DELETED_KEY, JSON.stringify(next));
  } catch {
    // best-effort
  }
}

function writeRenamesToStorage(next: RenamesMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RENAMES_KEY, JSON.stringify(next));
  } catch {
    // best-effort
  }
}

function notifyDeleted(): void {
  for (const cb of deletedSubscribers) cb();
}

function notifyRenames(): void {
  for (const cb of renamesSubscribers) cb();
}

// ---- Deleted ---------------------------------------------------------

export function markContactDeleted(name: string): void {
  if (deletedSnapshot[name]) return;
  deletedSnapshot = { ...deletedSnapshot, [name]: true };
  writeDeletedToStorage(deletedSnapshot);
  notifyDeleted();
}

export function isContactDeleted(name: string): boolean {
  return deletedSnapshot[name] === true;
}

export function getDeletedContacts(): DeletedMap {
  return deletedSnapshot;
}

export function useDeletedContacts(): DeletedMap {
  return useSyncExternalStore(
    cb => {
      deletedSubscribers.add(cb);
      return () => {
        deletedSubscribers.delete(cb);
      };
    },
    getDeletedContacts,
    () => ({}),
  );
}

// ---- Renames ---------------------------------------------------------

/**
 * Apply a rename. We resolve any indirection so the map stays flat:
 * if `oldName` was itself a rename target, the new entry uses the
 * ultimate source name as the key. Idempotent on no-op.
 */
export function setContactRename(oldName: string, newName: string): void {
  if (oldName === newName) return;
  renamesSnapshot = { ...renamesSnapshot, [oldName]: newName };
  writeRenamesToStorage(renamesSnapshot);
  notifyRenames();
}

export function getContactRenames(): RenamesMap {
  return renamesSnapshot;
}

export function useContactRenames(): RenamesMap {
  return useSyncExternalStore(
    cb => {
      renamesSubscribers.add(cb);
      return () => {
        renamesSubscribers.delete(cb);
      };
    },
    getContactRenames,
    () => ({}),
  );
}
