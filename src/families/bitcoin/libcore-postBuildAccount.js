// @flow
import { log } from "@ledgerhq/logs";
import type { Account } from "../../types";
import type { BitcoinResources } from "./types";
import type { CoreAccount } from "../../libcore/types";
import { promiseAllBatched } from "../../promise";
import { parseBitcoinUTXO, perCoinLogic } from "./transaction";

const postBuildAccount = async ({
  account,
  coreAccount,
}: {
  account: Account,
  coreAccount: CoreAccount,
}): Promise<Account> => {
  log("bitcoin/post-buildAccount", "bitcoinResources");
  const bitcoinLikeAccount = await coreAccount.asBitcoinLikeAccount();
  const count = await bitcoinLikeAccount.getUTXOCount();
  const objects = await bitcoinLikeAccount.getUTXO(0, count);
  const utxos = await promiseAllBatched(6, objects, parseBitcoinUTXO);
  const perCoin = perCoinLogic[account.currency.id];
  let bitcoinResources: BitcoinResources = {
    ...account.bitcoinResources,
    utxos,
  };
  if (perCoin) {
    if (perCoin.postBuildBitcoinResources) {
      bitcoinResources = perCoin.postBuildBitcoinResources(
        account,
        bitcoinResources
      );
    }
    const { syncReplaceAddress } = perCoin;
    if (syncReplaceAddress) {
      account.freshAddress = syncReplaceAddress(account, account.freshAddress);
      account.freshAddresses = account.freshAddresses.map((a) => ({
        ...a,
        address: syncReplaceAddress(account, a.address),
      }));
      bitcoinResources.utxos = bitcoinResources.utxos.map((u) => ({
        ...u,
        address: u.address && syncReplaceAddress(account, u.address),
      }));
    }
  }
  account.bitcoinResources = bitcoinResources;
  log("bitcoin/post-buildAccount", "bitcoinResources DONE");
  return account;
};

export default postBuildAccount;
