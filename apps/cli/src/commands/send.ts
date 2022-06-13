import { from, defer, of, concat, EMPTY, Observable } from "rxjs";
import {
  map,
  switchMap,
  mergeMap,
  concatMap,
  catchError,
  tap,
} from "rxjs/operators";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import {
  formatOperation,
  formatAccount,
  fromOperationRaw,
} from "@ledgerhq/live-common/lib/account";
import {
  toSignOperationEventRaw,
  formatTransaction,
  formatTransactionStatus,
} from "@ledgerhq/live-common/lib/transaction";
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
      desc: "when using multiple transactions, an error won't stop the flow",
    },
    {
      name: "disable-broadcast",
      type: Boolean,
      desc: "do not broadcast the transaction",
    },
    {
      name: "format",
      type: String,
      desc: "default | json | silent",
    },
  ],
  job: (
    opts: ScanCommonOpts &
      InferTransactionsOpts & {
        "ignore-errors": boolean;
        "disable-broadcast": boolean;
        format: string;
      }
  ) => {
    const l =
      opts.format !== "json" && opts.format !== "silent" // eslint-disable-next-line no-console
        ? (l) => console.log(l)
        : (_l) => {};
    return scan(opts).pipe(
      tap((account) => {
        l(`→ FROM ${formatAccount(account, "basic")}`);
      }),
      switchMap((account) =>
        from(inferTransactions(account, opts)).pipe(
          concatMap((inferred) =>
            inferred.reduce(
              (acc, [t, status]) =>
                concat(
                  acc,
                  from(
                    defer(() => {
                      l(`✔️ transaction ${formatTransaction(t, account)}`);
                      l(
                        `STATUS ${formatTransactionStatus(t, status, account)}`
                      );
                      const bridge = getAccountBridge(account);
                      return bridge
                        .signOperation({
                          account,
                          transaction: t,
                          deviceId: opts.device || "",
                        })
                        .pipe(
                          map(toSignOperationEventRaw),
                          // @ts-expect-error more voodoo stuff
                          ...(opts["disable-broadcast"] ||
                          getEnv("DISABLE_TRANSACTION_BROADCAST")
                            ? []
                            : [
                                concatMap((e: any) => {
                                  if (e.type === "signed") {
                                    l(
                                      `✔️ has been signed! ${JSON.stringify(
                                        e.signedOperation
                                      )}`
                                    );
                                    return from(
                                      bridge
                                        .broadcast({
                                          account,
                                          signedOperation: e.signedOperation,
                                        })
                                        .then((op) => {
                                          l(
                                            `✔️ broadcasted! optimistic operation: ${formatOperation(
                                              account
                                            )(
                                              // @ts-expect-error we are supposed to give an OperationRaw and yet it's an Operation
                                              fromOperationRaw(op, account.id)
                                            )}`
                                          );
                                          return op;
                                        })
                                    );
                                  }

                                  return of(e);
                                }),
                              ]),
                          ...(opts["ignore-errors"]
                            ? [
                                catchError((e) => {
                                  return of({
                                    type: "error",
                                    error: e,
                                    transaction: t,
                                  });
                                }),
                              ]
                            : [])
                        );
                    })
                  )
                ),
              EMPTY as Observable<any>
            )
          ),
          mergeMap((obj) =>
            opts.format !== "json" ? EMPTY : of(JSON.stringify(obj))
          )
        )
      )
    );
  },
};
