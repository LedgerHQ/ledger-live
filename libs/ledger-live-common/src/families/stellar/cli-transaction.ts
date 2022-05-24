import invariant from "invariant";
import type {
  Transaction,
  AccountLike,
  Account,
  AccountLikeArray,
} from "../../types";
const options = [
  {
    name: "fee",
    type: String,
    desc: "how much fee",
  },
  {
    name: "memoType",
    type: String,
    desc: "stellar memo type",
  },
  {
    name: "memoValue",
    type: String,
    desc: "stellar memo value",
  },
];

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  opts: Record<string, any>
): Transaction[] {
  return transactions.map(({ transaction }) => {
    invariant(transaction.family === "stellar", "stellar family");
    return {
      ...transaction,
      memoType: opts.memoType,
      memoValue: opts.memoValue,
    };
  });
}

function inferAccounts(
  account: Account,
  opts: Record<string, any>
): AccountLikeArray {
  invariant(account.currency.family === "stellar", "stellar family");

  if (opts.subAccountId) {
    const assetSubAccount = account.subAccounts?.find(
      (a) => a.id === opts.subAccountId
    );

    if (!assetSubAccount) {
      throw new Error(`${opts.subAccountId} asset not found`);
    }

    return [assetSubAccount];
  }

  return [account];
}

export default {
  options,
  inferAccounts,
  inferTransactions,
};
