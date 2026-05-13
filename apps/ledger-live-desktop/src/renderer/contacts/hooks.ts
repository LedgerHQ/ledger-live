import { useCallback, useEffect, useState } from "react";
import { getContactsWallet, resetContactsWallet, setContactsWallet } from "./storage";
import {
  emptyPersistedContacts,
  type ContactsWallet,
  type PersistedContacts,
  CONTACTS_SCHEMA_VERSION,
} from "./types";

/**
 * Boundary contract for L1 / L3 / L4. Wraps the contacts storage IPC
 * with React state + dispatch-shaped mutators. L0 is plumbing-only —
 * mutators just edit the persisted blob. L1 wires each mutator to a
 * DMK call.
 *
 * Designer's coding agent should ONLY import from this module — never
 * from `./storage` or `./types` directly, and never from
 * `@ledgerhq/device-management-kit` / `@ledgerhq/device-signer-kit-ethereum`.
 */
export const useContactsStore = () => {
  const [persisted, setPersisted] = useState<PersistedContacts>(emptyPersistedContacts);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getContactsWallet().then(value => {
      if (cancelled) return;
      setPersisted(value);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback(async (next: ContactsWallet) => {
    const blob: PersistedContacts = {
      schemaVersion: CONTACTS_SCHEMA_VERSION,
      wallet: next,
    };
    setPersisted(blob);
    await setContactsWallet(blob);
  }, []);

  const reset = useCallback(async () => {
    await resetContactsWallet();
    setPersisted(emptyPersistedContacts());
  }, []);

  return {
    hydrated,
    wallet: persisted.wallet,
    schemaVersion: persisted.schemaVersion,
    commit,
    reset,
  };
};
