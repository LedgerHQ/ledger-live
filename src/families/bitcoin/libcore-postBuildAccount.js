// @flow
import { log } from "@ledgerhq/logs";
import type { Account } from "../../types";
import type { CoreAccount } from "../../libcore/types";
import { promiseAllBatched } from "../../promise";
import { parseBitcoinOutput } from "./transaction";

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
  const utxos = await promiseAllBatched(6, objects, parseBitcoinOutput);
  account.bitcoinResources = { utxos };
  log("bitcoin/post-buildAccount", "bitcoinResources DONE");
  return account;
};

export default postBuildAccount;
