import type { KeychainEntry } from "../key-ring/keychain-entry";

/** Stands in for the OS keychain behind `_setTestKeychain`, so tests never touch the real one. */
export class InMemoryKeychain {
  /** Stored passwords keyed by `<service>:<account>`. */
  readonly entries = new Map<string, string>();
  /** When set, every read throws it, like a locked or missing keychain backend. */
  readError: Error | undefined;
  /** When set, every write throws it, like a keychain that refuses to store. */
  writeError: Error | undefined;
  /** When set, every delete throws it, like a keychain that refuses to delete. */
  deleteError: Error | undefined;
  /** When set, opening an entry throws it, like a pinned entry with no Secret Service reachable. */
  openError: Error | undefined;

  readonly open = (service: string, account: string): KeychainEntry => {
    if (this.openError) throw this.openError;
    const key = `${service}:${account}`;
    return {
      getPassword: () => {
        if (this.readError) throw this.readError;
        return this.entries.get(key) ?? null;
      },
      setPassword: value => {
        if (this.writeError) throw this.writeError;
        this.entries.set(key, value);
      },
      deletePassword: () => {
        if (this.deleteError) throw this.deleteError;
        return this.entries.delete(key);
      },
    };
  };
}
