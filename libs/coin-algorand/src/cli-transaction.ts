import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";
import type { Account, AccountLike, AccountLikeArray } from "@ledgerhq/types-live";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import { extractTokenId } from "./tokens";
import type { AlgorandAccount, Transaction } from "./types";

const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send, optIn, claimReward",
  },
  {
    name: "fees",
    type: String,
    desc: "how much fees",
  },
  {
    name: "gasLimit",
    type: String,
    desc: "how much gasLimit. default is estimated with the recipient",
  },
  {
    name: "memo",
    type: String,
    desc: "set a memo",
  },
  {
    name: "token",
    alias: "t",
    type: String,
    desc: "use an token account children of the account",
    multiple: true,
  },
];

function inferAccounts(account: Account, opts: Record<string, any>): AccountLikeArray {
  invariant(account.currency.family === "algorand", "algorand family");

  if (!opts.token || opts.mode === "optIn") {
    const accounts: Account[] = [account];
    return accounts;
  }

  return opts.token.map((token?: string) => {
    const subAccounts = account.subAccounts || [];

    if (token) {
      const subAccount = subAccounts.find(t => {
        const currency = getAccountCurrency(t);
        return (
          token.toLowerCase() === currency.ticker.toLowerCase() ||
          token.toLowerCase() === extractTokenId(currency.id)
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

      return subAccount;
    }
  });
}

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  opts: Record<string, any>,
  { inferAmount }: any,
): Transaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    invariant(transaction.family === "algorand", "algorand family");

    if (account.type === "Account") {
      invariant((account as AlgorandAccount).algorandResources, "unactivated account");
    }

    if (account.type === "TokenAccount") {
      const isDelisted = account.token.delisted === true;
      invariant(!isDelisted, "token is delisted");
    }

    return {
      ...transaction,
      family: "algorand",
      fees: opts.fees ? inferAmount(account, opts.fees) : null,
      memo: opts.memo,
      mode: opts.mode || "send",
      subAccountId: account.type === "TokenAccount" ? account.id : null,
      assetId: opts.token ? "algorand/asa/" + opts.token : null,
    };
  });
}

export default function makeCliTools() {
  return {
    options,
    inferAccounts,
    inferTransactions,
  };
}
