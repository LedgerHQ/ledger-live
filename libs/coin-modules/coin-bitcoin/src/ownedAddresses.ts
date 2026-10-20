import type { Account } from "@ledgerhq/types-live";
import type { BitcoinAccount } from "./types";

/**
 * Every address of the account: the receive and change addresses that already have transactions,
 * the fresh receive address, and the next change address, which the change output of the next send
 * goes to.
 */
export async function getOwnedAddresses(account: Account): Promise<string[]> {
  const walletAccount = (account as BitcoinAccount).bitcoinResources?.walletAccount;
  if (!walletAccount) {
    return account.freshAddress ? [account.freshAddress] : [];
  }

  const [storedAddresses, nextChangeAddress] = await Promise.all([
    walletAccount.xpub.getXpubAddresses(),
    walletAccount.xpub.getNewAddress(1, 1),
  ]);

  const addresses = [
    ...storedAddresses.map(({ address }) => address),
    account.freshAddress,
    nextChangeAddress.address,
  ];
  return [...new Set(addresses.filter(Boolean))];
}
