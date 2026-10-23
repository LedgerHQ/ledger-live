import type { KeychainEntry } from "../key-ring/keychain-entry";

/** Stands in for the OS keychain behind `_setTestKeychain`, so tests never touch the real one. */
export class InMemoryKeychain {
  /** Stored passwords keyed by `<service>:<account>`. */
  readonly entries = new Map<string, string>();
  /** When set, every read throws it, like a locked or missing keychain backend. */
  readError: Error | undefined;
  /** When set, every write throws it, like a keychain that refuses to store. */
  writeError: Error | undefined;

  readonly open = (service: string, account: string): KeychainEntry => {
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
      deletePassword: () => this.entries.delete(key),
    };
  };
}
