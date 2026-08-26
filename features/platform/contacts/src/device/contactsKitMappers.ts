import { bufferToHexaString, hexaStringToBuffer } from "@ledgerhq/device-management-kit";
import { ContactDeviceIntentInputError } from "./errors";

/**
 * Shared conversions between Ledger Wallet's string/number Contacts intent
 * contracts and `@ledgerhq/device-contacts-kit`'s byte/bigint wire types.
 * Every Contacts intent job needs some subset of these; keep intent-specific
 * shapes (e.g. an intent's own `existingContactGroup` composite) local to
 * that intent's job instead.
 */

export function mapIdentifierToBytes(identifier: string): Uint8Array {
  const bytes = hexaStringToBuffer(identifier);
  if (bytes === null) {
    throw new ContactDeviceIntentInputError(
      `identifier ${JSON.stringify(identifier)} is not valid hex`,
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

export function mapGroupHandleToBytes(groupHandle: string): Uint8Array {
  const bytes = hexaStringToBuffer(groupHandle);
  if (bytes === null) {
    throw new ContactDeviceIntentInputError(
      `groupHandle ${JSON.stringify(groupHandle)} is not valid hex`,
    );
  }
  return bytes;
}

export function mapBytesToGroupHandle(bytes: Uint8Array): string {
  return bufferToHexaString(bytes);
}

export function mapProofToBytes(proof: string): Uint8Array {
  const bytes = hexaStringToBuffer(proof);
  if (bytes === null) {
    throw new ContactDeviceIntentInputError(`proof ${JSON.stringify(proof)} is not valid hex`);
  }
  return bytes;
}

export function mapBytesToProof(bytes: Uint8Array): string {
  return bufferToHexaString(bytes);
}
