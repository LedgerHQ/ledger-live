import type {
  Account,
  AccountLike,
  AccountLikeArray,
} from "@ledgerhq/types-live";

import { from } from "rxjs";
import { map } from "rxjs/operators";
import { getValidatorGroups } from "../celo/api";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import type { Transaction } from "../celo/types";

const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send, lock, unlock, withdraw, vote, revoke, activate, register",
  },
  {
    name: "transactionIndex",
    type: String,
    desc: "transaction index of a pending withdraw in case of withdraw mode",
  },
];

function inferAccounts(account: Account): AccountLikeArray {
  invariant(account.currency.family === "celo", "celo family");

  const accounts: Account[] = [account];
  return accounts;
}

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
    mainAccount: Account;
  }>,
  opts: Record<string, any>
): Transaction[] {
  const mode = opts.mode || "send";
  invariant(
    [
      "send",
      "lock",
      "unlock",
      "withdraw",
      "vote",
      "revoke",
      "activate",
      "register",
    ].includes(mode),
    `Unexpected mode: ${mode}`
  );

  return flatMap(transactions, ({ transaction }) => {
    invariant(transaction.family === "celo", "celo family");

    return {
      ...transaction,
      family: "celo",
      mode,
      index: opts.transactionIndex || null,
    } as Transaction;
  });
}

const celoValidatorGroups = {
  args: [],
  job: () =>
    from(getValidatorGroups()).pipe(
      map((validatorGroup) => JSON.stringify(validatorGroup))
    ),
};

export default {
  options,
  inferAccounts,
  inferTransactions,
  commands: {
    celoValidatorGroups,
  },
};
