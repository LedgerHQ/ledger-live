import { useCallback, useEffect, useSyncExternalStore } from "react";
import { getContactsWallet, resetContactsWallet, setContactsWallet } from "./storage";
import {
  emptyPersistedContacts,
  type ContactsWallet,
  type PersistedContacts,
  CONTACTS_SCHEMA_VERSION,
} from "./types";

/**
 * Boundary contract for L1 / L3 / L4. Wraps the contacts storage IPC with a
 * shared subscribable state — `useSyncExternalStore` ensures every consumer
 * (the Contacts dialog and the data-source registration in `Default.tsx`)
 * observes the same wallet snapshot. A previous `useState`-per-consumer
 * implementation let the registration hook hold a stale empty wallet long
 * after a contact had been committed, so the DMK ContextModule served `null`
 * during signing and the device displayed raw hex addresses.
 *
 * Designer's coding agent should ONLY import from this module — never
 * from `./storage` or `./types` directly, and never from
 * `@ledgerhq/device-management-kit` / `@ledgerhq/device-signer-kit-ethereum`.
 */

type Snapshot = {
  hydrated: boolean;
  persisted: PersistedContacts;
};

let snapshot: Snapshot = { hydrated: false, persisted: emptyPersistedContacts() };
const listeners = new Set<() => void>();
let hydrationStarted = false;

const setSnapshot = (next: Snapshot) => {
  // Preserve referential equality across no-op updates so React's external
  // store comparison can bail out cleanly.
  if (next === snapshot) return;
  snapshot = next;
  for (const listener of listeners) listener();
};

const ensureHydration = () => {
  if (hydrationStarted) return;
  hydrationStarted = true;
  void getContactsWallet()
    .then(value => setSnapshot({ hydrated: true, persisted: value }))
    .catch(() => setSnapshot({ hydrated: true, persisted: emptyPersistedContacts() }));
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): Snapshot => snapshot;

export const useContactsStore = () => {
  // Hydration must trigger from a consumer that mounts inside the React tree;
  // calling it inside an effect avoids running the IPC during the render pass.
  useEffect(() => {
    ensureHydration();
  }, []);

  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const commit = useCallback(async (next: ContactsWallet) => {
    const blob: PersistedContacts = {
      schemaVersion: CONTACTS_SCHEMA_VERSION,
      wallet: next,
    };
    setSnapshot({ hydrated: true, persisted: blob });
    await setContactsWallet(blob);
  }, []);

  const reset = useCallback(async () => {
    await resetContactsWallet();
    setSnapshot({ hydrated: true, persisted: emptyPersistedContacts() });
  }, []);

  return {
    hydrated: current.hydrated,
    wallet: current.persisted.wallet,
    schemaVersion: current.persisted.schemaVersion,
    commit,
    reset,
  };
};
