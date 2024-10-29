import { from, of, concat, EMPTY, Observable } from "rxjs";
import { map, mergeMap, concatMap } from "rxjs/operators";
import {
  toTransactionRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
  formatTransaction,
} from "@ledgerhq/live-common/transaction/index";
import { scan, scanCommonOpts } from "../../scan";
import type { ScanCommonOpts } from "../../scan";
import type { InferTransactionsOpts } from "../../transaction";
import { inferTransactions, inferTransactionsOpts } from "../../transaction";
import type { Account, TransactionStatusCommon } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";

// Typing for the function using these entities:
type TransactionStatusFormatterInput = {
  transaction: Transaction;
  status: TransactionStatusCommon;
  account: Account;
};

const getTransactionStatusFormatters: Record<
  string,
  (input: TransactionStatusFormatterInput) => string
> = {
  default: ({ status, transaction, account }) =>
    "TRANSACTION " +
    (formatTransaction(transaction, account) || JSON.stringify(toTransactionRaw(transaction))) +
    "\n" +
    "STATUS " +
    formatTransactionStatus(transaction, status, account),
  json: ({ status, transaction, account }) =>
    "TRANSACTION " +
    JSON.stringify(toTransactionRaw(transaction)) +
    "\n" +
    "STATUS " +
    JSON.stringify(toTransactionStatusRaw(status, account.currency.family)),
};

export type GetTransactionStatusJobOpts = ScanCommonOpts &
  InferTransactionsOpts & {
    format: "default" | "json";
  };

export default {
  description: "Prepare a transaction and returns 'TransactionStatus' meta information",
  args: [
    ...scanCommonOpts,
    ...inferTransactionsOpts,
    {
      name: "format",
      alias: "f",
      type: String,
      typeDesc: Object.keys(getTransactionStatusFormatters).join(" | "),
      desc: "how to display the data",
    },
  ],
  job: (
    opts: ScanCommonOpts &
      InferTransactionsOpts & {
        format: string;
      },
  ) =>
    scan(opts).pipe(
      concatMap(account =>
        from(inferTransactions(account, opts)).pipe(
          mergeMap(inferred =>
            inferred.reduce(
              (acc, [transaction, status]) =>
                concat(
                  acc,
                  of({
                    transaction,
                    status,
                    account,
                  }),
                ),
              EMPTY as Observable<any>,
            ),
          ),
          map(e => {
            const f = getTransactionStatusFormatters[opts.format || "default"];

            if (!f) {
              throw new Error(
                "getTransactionStatusFormatters: no such formatter '" + opts.format + "'",
              );
            }

            return f(e);
          }),
        ),
      ),
    ),
};
