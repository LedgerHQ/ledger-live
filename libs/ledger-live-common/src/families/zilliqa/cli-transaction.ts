import type { AccountLike } from "@ledgerhq/types-live";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import type { Transaction } from "../../generated/types";
import type { ZilliqaAccount } from "./types";
const options = [];

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  _opts: Record<string, any>
): Transaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    invariant(transaction.family === "zilliqa", "zilliqa family");

    if (account.type === "Account") {
      invariant(
        (account as ZilliqaAccount).zilliqaResources,
        "unactivated account"
      );
    }

    transaction.family = "zilliqa";

    return transaction;
  });
}

export default {
  options,
  inferTransactions,
};
