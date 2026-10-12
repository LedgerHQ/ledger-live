import type { ZcashAccount } from "@ledgerhq/coin-zcash/types/bridge";

/**
 * Every address by which this account can be recognized as a send recipient.
 * A Zcash account with an exported private balance is also recognized by its
 * unified shielded address -- stable once derived from the UFVK at export, so
 * pasting either address resolves to the same Ledger account. Without a
 * shielded address yet, it is recognized by its transparent fresh address only.
 */
export function getAccountRecipientAddresses(account: ZcashAccount): string[] {
  const addresses = [account.freshAddress];
  if (account.privateInfo?.shieldedAddress) addresses.push(account.privateInfo.shieldedAddress);
  return addresses;
}
