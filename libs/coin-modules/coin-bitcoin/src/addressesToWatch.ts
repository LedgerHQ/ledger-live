import range from "lodash/range";
import type { Account } from "@ledgerhq/types-live";
import type { BitcoinAccount } from "./types";

const RECEIVE_CHAIN = 0;
const CHANGE_CHAIN = 1;
const recentAddressesPerChain = 20;

/**
 * The addresses of the account worth watching: the ones holding funds (pending incoming funds
 * included), the last addresses derived on the receive and change chains, the fresh receive address
 * and the next change address, which the change output of the next send goes to.
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
  const deriveRecentAddresses = (chain: number, nextIndex: number) =>
    Promise.all(
      range(Math.max(0, nextIndex - recentAddressesPerChain), nextIndex).map(index =>
        xpub.crypto.getAddress(xpub.derivationMode, xpub.xpub, chain, index),
      ),
    );
  const [recentReceiveAddresses, recentChangeAddresses] = await Promise.all([
    deriveRecentAddresses(RECEIVE_CHAIN, xpub.freshAddressIndex),
    deriveRecentAddresses(CHANGE_CHAIN, nextChangeAddress.index),
  ]);
  const fundedAddresses = storedAddresses
    .filter(address => xpub.storage.getAddressUnspentUtxos(address)?.length > 0)
    .map(({ address }) => address);

  const addresses = [
    ...fundedAddresses,
    ...recentReceiveAddresses,
    account.freshAddress,
    ...recentChangeAddresses,
    nextChangeAddress.address,
  ];
  return [...new Set(addresses.filter(Boolean))];
}
