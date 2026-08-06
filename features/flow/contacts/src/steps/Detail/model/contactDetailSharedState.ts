import type { Contact } from "@domain/entity-contact";
import { resolveMeContactDisplayName } from "../../../utils";
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
  formatMeDisplayName: (name: string) => string = name => name,
): ContactDetailSharedState {
  return {
    contact,
    displayName: resolveMeContactDisplayName(contact, formatMeDisplayName),
    addressCount: contact.addresses.length,
    ledgerWalletAccountsIntent: createContactDetailLedgerWalletAccountsIntent(contact),
  };
}
