import { bufferToHexaString, hexaStringToBuffer } from "@ledgerhq/device-management-kit";
import { ContactDeviceIntentInputError } from "./errors";

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
 * Contact addresses are family-agnostic in the domain layer (Solana base58,
 * Bitcoin bech32, ...), but the Contacts kit only ships Ethereum's REGISTER
 * IDENTITY in v1, so the only identifier this ever has to encode today is an
 * EVM hex address. A non-hex identifier throws `ContactDeviceIntentInputError`,
 * which the job already turns into a graceful `invalid-input` job state rather
 * than an uncaught error. Widening past hex needs a per-family encoding this
 * function doesn't have yet, gated on the kit adding that family's device
 * action.
 */
export function mapIdentifierToBytes(identifier: string): Uint8Array {
  return decodeHexOrThrow(identifier, "identifier");
}

export function mapChainIdToBigInt(chainId: string | number): bigint {
  try {
    return BigInt(chainId);
  } catch {
    throw new ContactDeviceIntentInputError(`chainId ${JSON.stringify(chainId)} is not an integer`);
  }
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
