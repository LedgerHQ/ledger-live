import { AccountBridge } from "@ledgerhq/types-live";
import { accountNamesCache, getTronAccountNetwork } from "../network";
import { Transaction, TronAccount } from "../types";

export const prepareTransaction: AccountBridge<
  Transaction,
  TronAccount
>["prepareTransaction"] = async (account, transaction) => {
  const networkInfo =
    transaction.networkInfo || (await getTronAccountNetwork(account.freshAddress));

  if (transaction.votes.length) {
    transaction.votes = await Promise.all(
      transaction.votes.map(async vote => ({
        ...vote,
        name: await accountNamesCache(vote.address),
      })),
    );
  }

  return transaction.networkInfo === networkInfo ? transaction : { ...transaction, networkInfo };
};
