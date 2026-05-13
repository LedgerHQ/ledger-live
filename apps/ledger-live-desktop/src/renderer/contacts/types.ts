/**
 * Persisted shape mirroring the DMK `Wallet` types. Schema is camelCase
 * (DMK shape), not Python snake_case — so values flow straight into
 * `SignerEth` / `ContactsService` calls without renaming.
 *
 * Re-point these to `@ledgerhq/device-management-kit` exports during L1
 * once the DMK snapshot is pinned.
 */

export const CONTACTS_SCHEMA_VERSION = 1;

export type ContactEntry = {
  scope: string;
  addressHex: string;
  hmacRestHex: string;
  derivationPath: string;
  chainId: number;
};

export type Contact = {
  name: string;
  groupHandleHex: string;
  hmacNameHex: string;
  entries: ContactEntry[];
};

export type LedgerAccount = {
  name: string;
  derivationPath: string;
  chainId: number;
  addressHex: string;
  hmacProofHex: string;
};

export type ContactsWallet = {
  contacts: Record<string, Contact>;
  accounts: Record<string, LedgerAccount>;
};

export type PersistedContacts = {
  schemaVersion: typeof CONTACTS_SCHEMA_VERSION;
  wallet: ContactsWallet;
};

export const emptyContactsWallet = (): ContactsWallet => ({
  contacts: {},
  accounts: {},
});

export const emptyPersistedContacts = (): PersistedContacts => ({
  schemaVersion: CONTACTS_SCHEMA_VERSION,
  wallet: emptyContactsWallet(),
});
