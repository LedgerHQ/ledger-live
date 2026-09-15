import type { BitcoinAccount, ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import type { ZcashPrivateInfo } from "@ledgerhq/coin-zcash/network/types";

/**
 * Every address by which this account can be recognized as a send recipient.
 * A Zcash account with an exported private balance is also recognized by its
 * unified shielded address -- stable once derived from the UFVK at export, so
 * pasting either address resolves to the same Ledger account. Every other
 * bitcoin-family currency (and a Zcash account with no shielded address yet)
 * is recognized by its transparent fresh address only.
 */
export function getAccountRecipientAddresses(account: BitcoinAccount): string[] {
  const addresses = [account.freshAddress];

  if (account.currency.id !== "zcash") return addresses;

  const privateInfo = (account as ZcashAccount).privateInfo as ZcashPrivateInfo | undefined;
  if (privateInfo?.shieldedAddress) addresses.push(privateInfo.shieldedAddress);

  return addresses;
}
