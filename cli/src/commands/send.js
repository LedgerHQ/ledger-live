// @flow

import { from, defer, of, concat, empty } from "rxjs";
import { map, switchMap, concatMap, catchError } from "rxjs/operators";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { toSignOperationEventRaw } from "@ledgerhq/live-common/lib/transaction";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";
import type { InferTransactionsOpts } from "../transaction";
import { inferTransactions, inferTransactionsOpts } from "../transaction";

export default {
  description: "Send crypto-assets",
  args: [
    ...scanCommonOpts,
    ...inferTransactionsOpts,
    {
      name: "ignore-errors",
      type: Boolean,
      desc: "when using multiple transactions, an error won't stop the flow"
    },
    {
      name: "disable-broadcast",
      type: Boolean,
      desc: "do not broadcast the transaction"
    }
  ],
  job: (
    opts: ScanCommonOpts &
      InferTransactionsOpts & {
        "ignore-errors": boolean,
        "disable-broadcast": boolean
      }
  ) =>
    scan(opts).pipe(
      switchMap(account =>
        from(inferTransactions(account, opts)).pipe(
          concatMap(inferred =>
            inferred.reduce(
              (acc, t) =>
                concat(
                  acc,
                  from(
                    defer(() => {
                      const bridge = getAccountBridge(account);
                      return bridge
                        .signOperation({
                          account,
                          transaction: t,
                          deviceId: opts.device || ""
                        })
                        .pipe(
                          map(toSignOperationEventRaw),
                          ...(opts["disable-broadcast"] ||
                          getEnv("DISABLE_TRANSACTION_BROADCAST")
                            ? []
                            : [
                                concatMap(e => {
                                  if (e.type === "signed") {
                                    return from(
                                      bridge.broadcast({
                                        account,
                                        signedOperation: e.signedOperation
                                      })
                                    );
                                  }
                                  return of(e);
                                })
                              ]),
                          ...(opts["ignore-errors"]
                            ? [
                                catchError(e => {
                                  return of({
                                    type: "error",
                                    error: e,
                                    transaction: t
                                  });
                                })
                              ]
                            : [])
                        );
                    })
                  )
                ),
              empty()
            )
          ),
          map(obj => JSON.stringify(obj))
        )
      )
    )
};
