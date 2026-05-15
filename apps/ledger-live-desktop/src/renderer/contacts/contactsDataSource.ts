import type {
  ContactDecoration,
  ContactLedgerAccountDecoration,
  ContactsDataSource,
  ContactsLookupKey,
} from "@ledgerhq/context-module";
import type { ContactsWallet } from "./types";

const normalize = (addressHex: string): string => {
  const trimmed = addressHex.trim().toLowerCase();
  return trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
};

const findLedgerAccount = (
  wallet: ContactsWallet,
  key: ContactsLookupKey,
): ContactLedgerAccountDecoration | null => {
  const target = normalize(key.address);
  for (const account of Object.values(wallet.accounts)) {
    if (account.chainId !== key.chainId) continue;
    if (normalize(account.addressHex) !== target) continue;
    return {
      accountName: account.name,
      hmacProofHex: account.hmacProofHex,
      derivationPath: account.derivationPath,
      chainId: account.chainId,
    };
  }
  return null;
};

const findExternalContact = (
  wallet: ContactsWallet,
  key: ContactsLookupKey,
): ContactDecoration | null => {
  const target = normalize(key.address);
  for (const contact of Object.values(wallet.contacts)) {
    for (const entry of contact.entries) {
      if (entry.chainId !== key.chainId) continue;
      if (normalize(entry.addressHex) !== target) continue;
      return {
        kind: "external",
        contactName: contact.name,
        scope: entry.scope,
        addressHex: entry.addressHex,
        groupHandleHex: contact.groupHandleHex,
        hmacNameHex: contact.hmacNameHex,
        hmacRestHex: entry.hmacRestHex,
        derivationPath: entry.derivationPath,
        chainId: entry.chainId,
      };
    }
  }
  return null;
};

const isWalletEmpty = (wallet: ContactsWallet): boolean =>
  Object.keys(wallet.contacts).length === 0 && Object.keys(wallet.accounts).length === 0;

export const buildContactsDataSource = (wallet: ContactsWallet): ContactsDataSource | null => {
  if (isWalletEmpty(wallet)) return null;
  return {
    async lookupFrom(key: ContactsLookupKey): Promise<ContactLedgerAccountDecoration | null> {
      return findLedgerAccount(wallet, key);
    },
    async lookupTo(key: ContactsLookupKey): Promise<ContactDecoration | null> {
      const ledger = findLedgerAccount(wallet, key);
      if (ledger) return { kind: "ledgerAccount", ...ledger };
      return findExternalContact(wallet, key);
    },
  };
};
