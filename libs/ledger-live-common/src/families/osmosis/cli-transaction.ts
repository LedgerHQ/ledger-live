import BigNumber from "bignumber.js";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import zipWith from "lodash/zipWith";

import type {
  Transaction,
  Account,
  AccountLike,
  AccountLikeArray,
} from "../../types";
import { CosmosDelegationInfo } from "../cosmos/types";

const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send, delegate, undelegate",
  },
  {
    name: "memo",
    type: String,
    desc: "add a memo to a transaction",
  },
  {
    name: "osmosValidator",
    type: String,
    multiple: true,
    desc: "address of recipient validator that will receive the delegate",
  },
  {
    name: "osmosAmountValidator",
    type: String,
    multiple: true,
    desc: "Amount that the validator will receive",
  },
];

function inferAccounts(account: Account): AccountLikeArray {
  invariant(account.currency.family === "osmosis", "osmosis family");

  const accounts: Account[] = [account];
  return accounts;
}

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
    mainAccount: Account;
  }>,
  opts: Record<string, any>,
  { inferAmount }: any
): Transaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    invariant(transaction.family === "osmosis", "osmosis family");
    const validatorsAddresses: string[] = opts["osmosValidator"] || [];

    const validatorsAmounts: BigNumber[] = (
      opts["osmosAmountValidator"] || []
    ).map((value) => {
      return inferAmount(account, value);
    });
    const validators: CosmosDelegationInfo[] = zipWith(
      validatorsAddresses,
      validatorsAmounts,
      (address, amount) => ({
        address,
        amount: amount || new BigNumber(0),
      })
    );

    return {
      ...transaction,
      family: "osmosis",
      mode: opts.mode || "send",
      fees: opts.fees ? inferAmount(account, opts.fees) : null,
      memo: opts.memo,
      validators: validators,
      // TODO - we should change this key to "sourceValidator" to make it more generic
      cosmosSourceValidator: opts.cosmosSourceValidator,
    } as Transaction;
  });
}

export default {
  options,
  inferAccounts,
  inferTransactions,
};
