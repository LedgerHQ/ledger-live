// @flow

import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import flatMap from "lodash/flatMap";
import { getAccountCurrency } from "../../account";
import type {
  Transaction,
  Account,
  AccountLike,
  AccountLikeArray,
} from "../../types";

const options = [
  {
    name: "token",
    alias: "t",
    type: String,
    desc: "use an token account children of the account",
    multiple: true,
  },
  {
    name: "gasPrice",
    type: String,
    desc:
      "how much gasPrice. default is 2gwei. (example format: 2gwei, 0.000001eth, in wei if no unit precised)",
  },
  {
    name: "gasLimit",
    type: String,
    desc: "how much gasLimit. default is estimated with the recipient",
  },
];

function inferAccounts(account: Account, opts: Object): AccountLikeArray {
  invariant(account.currency.family === "ethereum", "ethereum family");
  if (!opts.token) {
    const accounts: Account[] = [account];
    return accounts;
  }
  return opts.token.map((token) => {
    const subAccounts = account.subAccounts || [];
    if (token) {
      const tkn = token.toLowerCase();
      const subAccount = subAccounts.find((t) => {
        const currency = getAccountCurrency(t);
        return tkn === currency.ticker.toLowerCase() || tkn === currency.id;
      });
      if (!subAccount) {
        throw new Error(
          "token account '" +
            token +
            "' not found. Available: " +
            subAccounts.map((t) => getAccountCurrency(t).ticker).join(", ")
        );
      }
      return subAccount;
    }
  });
}

function inferTransactions(
  transactions: Array<{
    account: AccountLike,
    transaction: Transaction,
    mainAccount: Account,
  }>,
  opts: Object,
  { inferAmount }: *
): Transaction[] {
  return flatMap(transactions, ({ transaction, account, mainAccount }) => {
    invariant(transaction.family === "ethereum", "ethereum family");
    let subAccountId;
    if (account.type === "TokenAccount") {
      subAccountId = account.id;
    }
    return {
      ...transaction,
      family: "ethereum",
      subAccountId,
      gasPrice: inferAmount(mainAccount, opts.gasPrice || "2gwei"),
      userGasLimit: opts.gasLimit ? new BigNumber(opts.gasLimit) : null,
      estimatedGasLimit: null,
    };
  });
}

export default {
  options,
  inferAccounts,
  inferTransactions,
};
