import type { Contact } from "@domain/entity-contact";
import type { ContactDetailLedgerWalletAccountsIntent } from "../types";

export function createContactDetailLedgerWalletAccountsIntent(
  contact: Contact,
): ContactDetailLedgerWalletAccountsIntent | undefined {
  return contact.isMe ? { type: "open-ledger-wallet-accounts" } : undefined;
}

export type ContactDetailSharedState = Readonly<{
  contact: Contact;
  displayName: string;
  addressCount: number;
  ledgerWalletAccountsIntent: ContactDetailLedgerWalletAccountsIntent | undefined;
}>;

export function createContactDetailSharedState(
  contact: Contact,
  getDisplayName: (contact: Contact) => string,
): ContactDetailSharedState {
  return {
    contact,
    displayName: getDisplayName(contact),
    addressCount: contact.addresses.length,
    ledgerWalletAccountsIntent: createContactDetailLedgerWalletAccountsIntent(contact),
  };
}
