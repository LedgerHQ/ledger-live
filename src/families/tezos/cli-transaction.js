// @flow

import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import type {
  Transaction,
  Account,
  AccountLike,
  AccountLikeArray
} from "../../types";

const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction"
  },
  {
    name: "storageLimit",
    type: String,
    desc: "how much storageLimit. default is estimated with the recipient"
  },
  {
    name: "subAccount",
    type: String,
    desc: "use a sub account instead of the parent by index",
    multiple: true
  },
  {
    name: "fees",
    type: String,
    desc: "how much fees"
  },
  {
    name: "gasLimit",
    type: String,
    desc: "how much gasLimit. default is estimated with the recipient"
  }
];

function inferAccounts(account: Account, opts: Object): AccountLikeArray {
  invariant(account.currency.family === "tezos", "tezos family");
  if (!opts.subAccount) return [account];
  const { subAccounts } = account;
  invariant(subAccounts, "no sub accounts");
  return opts.subAccount.map(i => {
    const acc = subAccounts[i];
    invariant(acc, "sub account not found (index %s)", i);
    return acc;
  });
}

function inferTransactions(
  transactions: Array<{ account: AccountLike, transaction: Transaction }>,
  opts: Object,
  { inferAmount }: *
): Transaction[] {
  return transactions.flatMap(({ transaction, account }) => {
    invariant(transaction.family === "tezos", "tezos family");
    let subAccountId;
    if (account.type === "ChildAccount") {
      subAccountId = account.id;
    }
    return {
      ...transaction,
      mode: opts.mode || "send",
      subAccountId,
      fees: opts.fees ? inferAmount(account, opts.fees) : null,
      gasLimit: opts.gasLimit ? new BigNumber(opts.gasLimit) : null,
      storageLimit: opts.storageLimit ? new BigNumber(opts.storageLimit) : null
    };
  });
}

export default {
  options,
  inferAccounts,
  inferTransactions
};
