import { AccountAddress } from "@ledgerhq/hw-app-concordium/lib/address";

/**
 * Validates a Concordium account address using the SDK.
 * Checks that the address is exactly 50 characters, valid base58check encoding, and uses version byte 1.
 */
export function isRecipientValid(recipient: string): boolean {
  try {
    AccountAddress.fromBase58(recipient);
    return true;
  } catch {
    return false;
  }
}
