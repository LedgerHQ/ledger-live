import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";
import type { Account, AccountLike, AccountLikeArray } from "@ledgerhq/types-live";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import type { Transaction } from "../types";
import { AccountType } from "../types";

const options = [
  {
    name: "token",
    alias: "t",
    type: String,
    desc: "use an token account children of the account",
  },
];

function inferAccounts(account: Account, opts: Record<string, any>): AccountLikeArray {
  invariant(account.currency.family === "aptos", "aptos family");

  if (!opts.token) {
    const accounts: Account[] = [account];
    return accounts;
  }

  const token = opts.token;

  const subAccounts = account.subAccounts || [];

  if (token) {
    const subAccount = subAccounts.find(t => {
      const currency = getAccountCurrency(t);
      return (
        token.toLowerCase() === currency.ticker.toLowerCase() || token.toLowerCase() === currency.id
      );
    });

    if (!subAccount) {
      throw new Error(
        "token account '" +
          token +
          "' not found. Available: " +
          subAccounts.map(t => getAccountCurrency(t).ticker).join(", "),
      );
    }

    return [subAccount];
  }

  return [];
}

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
): Transaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    invariant(transaction.family === "aptos", "aptos family");

    if (account.type === AccountType.TokenAccount) {
      const isDelisted = account.token.delisted === true;
      invariant(!isDelisted, "token is delisted");
    }

    return {
      ...transaction,
      family: "aptos",
      subAccountId: account.type === AccountType.TokenAccount ? account.id : null,
    } as Transaction;
  });
}

export default function makeCliTools() {
  return {
    options,
    inferAccounts,
    inferTransactions,
  };
}
