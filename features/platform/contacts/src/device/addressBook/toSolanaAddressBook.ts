import type { Contact, ContactAddress } from "@domain/entity-contact";
import type {
  SolanaAddressBook,
  SolanaContactGroup,
  SolanaExternalAddress,
} from "@ledgerhq/device-signer-kit-solana";
import { tryDecodeHex } from "../contactsKitMappers";

/**
 * Contacts persist `currency.family` in their device context. Only this family
 * belongs in a Solana address book; EVM, Tron and any later family are filtered
 * out here so the signer's matching never needs a family discriminator.
 */
const SOLANA_BLOCKCHAIN_FAMILY = "solana";

/**
 * Base58 Solana address: a 32-byte public key encodes to 32 to 44 Base58
 * characters (the Bitcoin alphabet, so no `0`, `O`, `I`, `l`). Shape-only, like
 * the EVM and Tron mappers: the device checks the registered identifier, so a
 * malformed one just costs a contact name.
 */
const SOLANA_ADDRESS_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * Build the Solana address-book snapshot the Solana signer clear-signs against.
 *
 * Every record is validated on the way through and silently dropped when it
 * does not decode: proof material is opaque to Ledger Wallet, so a malformed or
 * still-unregistered entry must cost the user a contact name, never a
 * signature. Returns `undefined` when nothing survives, letting the caller skip
 * `withAddressBook` entirely and leave signing untouched.
 *
 * Like the Tron book, Solana records carry no chain id: the firmware
 * specification only includes one for Ethereum. Addresses are the wallet
 * public keys the contact was registered with, never token accounts: the signer
 * resolves SPL transfers to their owner itself. Ledger-account contacts are
 * never emitted (Ledger Wallet has no storage for their name proofs), so
 * `ledgerAccounts` always ships empty.
 */
export function toSolanaAddressBook(contacts: readonly Contact[]): SolanaAddressBook | undefined {
  const contactGroups = contacts.flatMap(toSolanaContactGroup);

  return contactGroups.length === 0 ? undefined : { contactGroups, ledgerAccounts: [] };
}

function toSolanaContactGroup(contact: Contact): SolanaContactGroup[] {
  const credentials = contact.deviceCredentials;
  if (credentials === undefined) return [];

  const groupHandle = tryDecodeHex(credentials.groupHandle);
  const hmacProof = tryDecodeHex(credentials.hmacProof);
  if (groupHandle === null || hmacProof === null) return [];

  const externalAddresses = contact.addresses.flatMap(toSolanaExternalAddress);
  if (externalAddresses.length === 0) return [];

  return [{ contactName: contact.name, groupHandle, hmacProof, externalAddresses }];
}

function toSolanaExternalAddress(address: ContactAddress): SolanaExternalAddress[] {
  const { blockchainFamily, hmacRest } = address.device;
  if (blockchainFamily !== SOLANA_BLOCKCHAIN_FAMILY) return [];

  const proof = tryDecodeHex(hmacRest);
  if (proof === null || !isSolanaAddress(address.address)) return [];

  return [
    {
      // The address label is what was registered as the device-side scope.
      scope: address.label,
      address: address.address,
      hmacRest: proof,
    },
  ];
}

function isSolanaAddress(value: string): boolean {
  return SOLANA_ADDRESS_PATTERN.test(value);
}
