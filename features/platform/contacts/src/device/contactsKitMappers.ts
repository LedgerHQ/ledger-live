import { bufferToHexaString, hexaStringToBuffer } from "@ledgerhq/device-management-kit";
import { ContactDeviceIntentInputError } from "./errors";
import { tryDecodeTronAddress } from "./tronAddress";

const EVM_BLOCKCHAIN_FAMILY = "evm";
const TRON_BLOCKCHAIN_FAMILY = "tron";

/**
 * Shared conversions between Ledger Wallet's string/number Contacts contracts
 * and `@ledgerhq/device-contacts-kit`'s byte/bigint wire types. Contacts intent
 * jobs and the EVM address-book snapshot both cross this boundary; keep
 * caller-specific shapes (e.g. an intent's own `existingContactGroup`
 * composite) local to that caller instead.
 *
 * Proof material and identifiers are persisted as whatever `mapBytesTo*`
 * produced, which is `0x`-prefixed because the kit's `bufferToHexaString`
 * always prefixes. Decoding therefore has to accept that prefix, and every
 * decoder here shares `tryDecodeHex` so the two directions cannot drift apart.
 */

/**
 * Decodes hex to bytes, or `null` when the string is not a faithful encoding.
 *
 * Stricter than the kit's own `hexaStringToBuffer`, which left-pads an
 * odd-length string and maps an empty one to zero bytes: either would turn a
 * truncated handle into a valid-looking but different value on its way to the
 * device, where the caller wants to reject it instead.
 */
export function tryDecodeHex(value: string): Uint8Array | null {
  const digits = value.replace(/^0x/i, "");
  if (digits.length === 0 || digits.length % 2 !== 0) return null;

  return hexaStringToBuffer(digits);
}

function decodeHexOrThrow(value: string, subject: string): Uint8Array {
  const bytes = tryDecodeHex(value);
  if (bytes === null) {
    throw new ContactDeviceIntentInputError(`${subject} ${JSON.stringify(value)} is not valid hex`);
  }

  return bytes;
}

/**
 * Contact addresses are stored in each family's human-readable form, so the
 * encoding to device bytes is per family (keyed by Ledger Wallet's own family,
 * e.g. "evm", not the kit's coin-app one): Tron's base58check `T…` address
 * becomes its 21-byte `0x41`-prefixed form, and every other supported family
 * (EVM) is hex. A malformed identifier throws `ContactDeviceIntentInputError`,
 * which the job already turns into a graceful `invalid-input` job state rather
 * than an uncaught error.
 */
export function mapIdentifierToBytes(identifier: string, blockchainFamily: string): Uint8Array {
  if (blockchainFamily !== TRON_BLOCKCHAIN_FAMILY) {
    return decodeHexOrThrow(identifier, "identifier");
  }

  const bytes = tryDecodeTronAddress(identifier);
  if (bytes === null) {
    throw new ContactDeviceIntentInputError(
      `identifier ${JSON.stringify(identifier)} is not a valid Tron address`,
    );
  }

  return bytes;
}

export function mapChainIdToBigInt(chainId: string | number): bigint {
  try {
    return BigInt(chainId);
  } catch {
    throw new ContactDeviceIntentInputError(`chainId ${JSON.stringify(chainId)} is not an integer`);
  }
}

/**
 * The CHAIN_ID the device binds into a registration, or `undefined` to omit it.
 * The firmware only defines one for the EVM family (many networks share one
 * address format); every other family registers without it, and the family's
 * signer provides the contact without one too, so sending Ledger Wallet's own
 * `chainId` (Tron's coin type) would bind proofs the signer can never match.
 */
export function mapChainIdForFamily(
  chainId: string | number,
  blockchainFamily: string,
): bigint | undefined {
  return blockchainFamily === EVM_BLOCKCHAIN_FAMILY ? mapChainIdToBigInt(chainId) : undefined;
}

export function mapGroupHandleToBytes(groupHandle: string): Uint8Array {
  return decodeHexOrThrow(groupHandle, "groupHandle");
}

export function mapBytesToGroupHandle(bytes: Uint8Array): string {
  return bufferToHexaString(bytes);
}

export function mapProofToBytes(proof: string): Uint8Array {
  return decodeHexOrThrow(proof, "proof");
}

export function mapBytesToProof(bytes: Uint8Array): string {
  return bufferToHexaString(bytes);
}
