import invariant from "invariant";
import flatMap from "lodash/flatMap";
import { getAccountCurrency } from "../../account";
import type { AccountLike, Account } from "../../types";
import { TokenAccount } from "../solana/api/chain/account/token";
import { Transaction } from "./types";

const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send",
  },
  {
    name: "token",
    type: String,
    desc: "uses subAccount(TokenAccount) of the account",
  },
];

function inferAccounts(
  account: Account,
  opts: Record<string, any>
): Account[] | TokenAccount[] {
  invariant(account.currency.family === "cardano", "cardano family");

  if (!opts.token) {
    const accounts: Account[] = [account];
    return accounts;
  }

  return opts.token.map((token) => {
    const subAccounts = account.subAccounts || [];

    const subAccount = subAccounts.find((a) => {
      const currency = getAccountCurrency(a);
      return token.toLowerCase() === currency.id.toLowerCase();
    });

    if (!subAccount) {
      throw new Error(
        "token account '" +
          token +
          "' not found. Available: " +
          subAccounts.map((t) => t.id).join("\n")
      );
    }

    return subAccount;
  });
}

function inferTransactions(
  transactions: Array<{ account: AccountLike; transaction: Transaction }>,
  opts: Record<string, any>
): Transaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    if (transaction.family !== "cardano") {
      throw new Error("transaction is not of type cardano");
    }

    if (account.type === "Account" && !account.cardanoResources) {
      throw new Error("unactivated account");
    }

    return {
      ...transaction,
      mode: opts.mode || "send",
      subAccountId: account.type === "TokenAccount" ? account.id : undefined,
    };
  });
}

export default {
  options,
  inferAccounts,
  inferTransactions,
};
