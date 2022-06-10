import { from, of, concat, EMPTY, Observable } from "rxjs";
import { map, mergeMap, concatMap } from "rxjs/operators";
import {
  toTransactionRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
  formatTransaction,
} from "@ledgerhq/live-common/lib/transaction";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";
import type { InferTransactionsOpts } from "../transaction";
import { inferTransactions, inferTransactionsOpts } from "../transaction";
const getTransactionStatusFormatters = {
  default: ({ status, transaction, account }) =>
    "TRANSACTION " +
    (formatTransaction(transaction, account) ||
      JSON.stringify(toTransactionRaw(transaction))) +
    "\n" +
    "STATUS " +
    formatTransactionStatus(transaction, status, account),
  json: ({ status, transaction }) =>
    "TRANSACTION " +
    JSON.stringify(toTransactionRaw(transaction)) +
    "\n" +
    "STATUS " +
    JSON.stringify(toTransactionStatusRaw(status)),
};
export default {
  description:
    "Prepare a transaction and returns 'TransactionStatus' meta information",
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
      }
  ) =>
    scan(opts).pipe(
      concatMap((account) =>
        from(inferTransactions(account, opts)).pipe(
          mergeMap((inferred) =>
            inferred.reduce(
              (acc, [transaction, status]) =>
                concat(
                  acc,
                  of({
                    transaction,
                    status,
                    account,
                  })
                ),
              EMPTY as Observable<any>
            )
          ),
          map((e) => {
            const f = getTransactionStatusFormatters[opts.format || "default"];

            if (!f) {
              throw new Error(
                "getTransactionStatusFormatters: no such formatter '" +
                  opts.format +
                  "'"
              );
            }

            return f(e);
          })
        )
      )
    ),
};
