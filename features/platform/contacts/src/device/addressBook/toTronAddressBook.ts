import type { Contact, ContactAddress } from "@domain/entity-contact";
import type {
  TronAddressBook,
  TronContactGroup,
  TronExternalAddress,
} from "@ledgerhq/device-signer-kit-tron";
import { tryDecodeHex } from "../contactsKitMappers";

/**
 * Contacts persist `currency.family` in their device context. Only this family
 * belongs in a Tron address book; EVM and any later family are filtered out
 * here so the signer's matching never needs a family discriminator.
 */
const TRON_BLOCKCHAIN_FAMILY = "tron";

/**
 * Base58Check Tron address: a leading `T` followed by 33 Base58 characters
 * (the Bitcoin alphabet, so no `0`, `O`, `I`, `l`). Shape-only, like the EVM
 * mapper: the device re-derives and checks the address, so a malformed one just
 * costs a contact name.
 */
const TRON_ADDRESS_PATTERN = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

/**
 * Build the Tron address-book snapshot the Tron signer clear-signs against.
 *
 * Every record is validated on the way through and silently dropped when it
 * does not decode: proof material is opaque to Ledger Wallet, so a malformed or
 * still-unregistered entry must cost the user a contact name, never a
 * signature. Returns `undefined` when nothing survives, letting the caller skip
 * `withAddressBook` entirely and leave signing untouched.
 *
 * Unlike the EVM book, Tron records carry no chain id: the firmware
 * specification only includes one for Ethereum. Ledger-account contacts are
 * never emitted (Ledger Wallet has no storage for their name proofs), so
 * `ledgerAccounts` always ships empty.
 */
export function toTronAddressBook(contacts: readonly Contact[]): TronAddressBook | undefined {
  const contactGroups = contacts.flatMap(toTronContactGroup);

  return contactGroups.length === 0 ? undefined : { contactGroups, ledgerAccounts: [] };
}

function toTronContactGroup(contact: Contact): TronContactGroup[] {
  const credentials = contact.deviceCredentials;
  if (credentials === undefined) return [];

  const groupHandle = tryDecodeHex(credentials.groupHandle);
  const hmacProof = tryDecodeHex(credentials.hmacProof);
  if (groupHandle === null || hmacProof === null) return [];

  const externalAddresses = contact.addresses.flatMap(toTronExternalAddress);
  if (externalAddresses.length === 0) return [];

  return [{ contactName: contact.name, groupHandle, hmacProof, externalAddresses }];
}

function toTronExternalAddress(address: ContactAddress): TronExternalAddress[] {
  const { blockchainFamily, hmacRest } = address.device;
  if (blockchainFamily !== TRON_BLOCKCHAIN_FAMILY) return [];

  const proof = tryDecodeHex(hmacRest);
  if (proof === null || !isTronAddress(address.address)) return [];

  return [
    {
      // The address label is what was registered as the device-side scope.
      scope: address.label,
      address: address.address,
      hmacRest: proof,
    },
  ];
}

function isTronAddress(value: string): boolean {
  return TRON_ADDRESS_PATTERN.test(value);
}
