import type { Contact, ContactAddress } from "@domain/entity-contact";
import type {
  EvmAddressBook,
  EvmContactGroup,
  EvmExternalAddress,
} from "@ledgerhq/device-signer-kit-ethereum";

/**
 * Contacts persist `currency.family` in their device context. Only this family
 * belongs in an EVM address book; Tron and any later family are filtered out
 * here so the signer's matching never needs a family discriminator.
 */
const EVM_BLOCKCHAIN_FAMILY = "evm";

const HEX_PATTERN = /^[0-9a-f]+$/;
const EVM_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

/**
 * Build the EVM address-book snapshot the Ethereum signer clear-signs against.
 *
 * Every record is validated on the way through and silently dropped when it
 * does not decode: proof material is opaque to Ledger Wallet, so a malformed or
 * still-unregistered entry must cost the user a contact name, never a
 * signature. Returns `undefined` when nothing survives, letting the caller skip
 * `withAddressBook` entirely and leave signing untouched.
 */
export function toEvmAddressBook(contacts: readonly Contact[]): EvmAddressBook | undefined {
  const contactGroups = contacts.flatMap(toEvmContactGroup);

  return contactGroups.length === 0 ? undefined : { contactGroups, ledgerAccounts: [] };
}

function toEvmContactGroup(contact: Contact): EvmContactGroup[] {
  const credentials = contact.deviceCredentials;
  if (credentials === undefined) return [];

  const groupHandle = hexToBytes(credentials.groupHandle);
  const hmacProof = hexToBytes(credentials.hmacProof);
  if (groupHandle === null || hmacProof === null) return [];

  const externalAddresses = contact.addresses.flatMap(toEvmExternalAddress);
  if (externalAddresses.length === 0) return [];

  return [{ contactName: contact.name, groupHandle, hmacProof, externalAddresses }];
}

function toEvmExternalAddress(address: ContactAddress): EvmExternalAddress[] {
  const { blockchainFamily, chainId, hmacRest } = address.device;
  if (blockchainFamily !== EVM_BLOCKCHAIN_FAMILY) return [];

  const proof = hexToBytes(hmacRest);
  const parsedChainId = toChainId(chainId);
  if (proof === null || parsedChainId === null || !isEvmAddress(address.address)) return [];

  return [
    {
      // The address label is what was registered as the device-side scope.
      scope: address.label,
      address: address.address,
      chainId: parsedChainId,
      hmacRest: proof,
    },
  ];
}

function isEvmAddress(value: string): value is `0x${string}` {
  return EVM_ADDRESS_PATTERN.test(value);
}

function toChainId(value: string | number): bigint | null {
  try {
    const chainId = BigInt(value);
    return chainId > 0n ? chainId : null;
  } catch {
    return null;
  }
}

function hexToBytes(value: string): Uint8Array | null {
  const normalized = value.toLowerCase();
  if (normalized.length === 0 || normalized.length % 2 !== 0 || !HEX_PATTERN.test(normalized)) {
    return null;
  }

  const bytes = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = Number.parseInt(normalized.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes;
}
