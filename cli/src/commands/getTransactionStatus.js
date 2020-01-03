// @flow

import { from, defer, concat, empty } from "rxjs";
import { map, mergeMap, concatMap } from "rxjs/operators";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import {
  toTransactionStatusRaw,
  toTransactionRaw
} from "@ledgerhq/live-common/lib/transaction";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";
import type { InferTransactionsOpts } from "../transaction";
import { inferTransactions, inferTransactionsOpts } from "../transaction";

const getTransactionStatusFormatters = {
  json: ({ status, transaction }) => ({
    status: JSON.stringify(toTransactionStatusRaw(status)),
    transaction: JSON.stringify(toTransactionRaw(transaction))
  })
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
      desc: "how to display the data"
    }
  ],
  job: (opts: ScanCommonOpts & InferTransactionsOpts & { format: string }) =>
    scan(opts).pipe(
      concatMap(account =>
        from(inferTransactions(account, opts)).pipe(
          mergeMap(inferred =>
            inferred.reduce(
              (acc, transaction) =>
                concat(
                  acc,
                  from(
                    defer(() =>
                      getAccountBridge(account)
                        .getTransactionStatus(account, transaction)
                        .then(status => ({ transaction, status }))
                    )
                  )
                ),
              empty()
            )
          ),
          map(e => {
            const f = getTransactionStatusFormatters[opts.format || "json"];
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
    )
};
