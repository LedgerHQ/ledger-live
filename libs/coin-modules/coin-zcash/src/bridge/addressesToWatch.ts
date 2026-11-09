import type { Account } from "@ledgerhq/types-live";
import type { BitcoinAccount } from "../types/bridge";

const CHANGE_CHAIN = 1;

/**
 * The transparent addresses of the account worth watching: the ones holding funds (pending incoming
 * funds included), the fresh receive address and the next change address, which the change output
 * of the next transparent send goes to. Private funds are invisible to address watchers.
 */
export async function getAddressesToWatch(account: Account): Promise<string[]> {
  const walletAccount = (account as BitcoinAccount).bitcoinResources?.walletAccount;
  if (!walletAccount) {
    return account.freshAddress ? [account.freshAddress] : [];
  }

  const { xpub } = walletAccount;
  const [storedAddresses, nextChangeAddress] = await Promise.all([
    xpub.getXpubAddresses(),
    xpub.getNewAddress(CHANGE_CHAIN, 1),
  ]);
  const fundedAddresses = storedAddresses
    .filter(address => xpub.storage.getAddressUnspentUtxos(address)?.length > 0)
    .map(({ address }) => address);

  const addresses = [...fundedAddresses, account.freshAddress, nextChangeAddress.address];
  return [...new Set(addresses.filter(Boolean))];
}
