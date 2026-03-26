import { from, defer, of, concat, EMPTY, Observable } from "rxjs";
import { map, switchMap, mergeMap, concatMap, catchError, tap } from "rxjs/operators";
import { getEnv } from "@ledgerhq/live-env";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  formatOperation,
  formatAccount,
  fromOperationRaw,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import {
  toSignOperationEventRaw,
  formatTransaction,
  formatTransactionStatus,
} from "@ledgerhq/live-common/transaction/index";
import { waitForTransactionConfirmation } from "@ledgerhq/live-common/families/evm/waitForConfirmation";
import { scan, scanCommonOpts } from "../../scan";
import type { ScanCommonOpts } from "../../scan";
import type { InferTransactionsOpts } from "../../transaction";
import { inferTransactions, inferTransactionsOpts } from "../../transaction";

export type SendJobOpts = ScanCommonOpts &
  InferTransactionsOpts & {
    "ignore-errors": boolean;
    "disable-broadcast": boolean;
    "wait-confirmation": boolean;
    "wait-confirmation-timeout": number;
    format: string;
  };

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
      name: "wait-confirmation",
      type: Boolean,
      desc: "after broadcast, wait until the transaction is confirmed on-chain (EVM only)",
    },
    {
      name: "wait-confirmation-timeout",
      type: Number,
      desc: "max ms to wait for confirmation (default 120000)",
    },
    {
      name: "format",
      type: String,
      desc: "default | json | silent",
    },
  ],
  job: (opts: SendJobOpts) => {
    const l =
      opts.format !== "json" && opts.format !== "silent" // eslint-disable-next-line no-console
        ? (l: any) => console.log(l)
        : (_l: any) => {};
    return scan(opts).pipe(
      tap(account => {
        l(`→ FROM ${formatAccount(account, "basic")}`);
      }),
      switchMap(account =>
        from(inferTransactions(account, opts)).pipe(
          concatMap(inferred =>
            inferred.reduce(
              (acc, [t, status]) =>
                concat(
                  acc,
                  from(
                    defer(() => {
                      l(`✔️ transaction ${formatTransaction(t, account)}`);
                      l(`STATUS ${formatTransactionStatus(t, status, account)}`);
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
                          ...(opts["disable-broadcast"] || getEnv("DISABLE_TRANSACTION_BROADCAST")
                            ? []
                            : [
                                concatMap((e: any) => {
                                  if (e.type === "signed") {
                                    l(`✔️ has been signed! ${JSON.stringify(e.signedOperation)}`);
                                    return from(
                                      bridge
                                        .broadcast({
                                          account,
                                          signedOperation: e.signedOperation,
                                        })
                                        .then(async op => {
                                          l(
                                            `✔️ broadcasted! optimistic operation: ${formatOperation(
                                              account,
                                            )(
                                              // @ts-expect-error we are supposed to give an OperationRaw and yet it's an Operation
                                              fromOperationRaw(op, account.id),
                                            )}`,
                                          );
                                          if (
                                            opts["wait-confirmation"] &&
                                            op.hash &&
                                            getMainAccount(account).currency.family === "evm"
                                          ) {
                                            const timeoutMs = opts["wait-confirmation-timeout"];
                                            await waitForTransactionConfirmation(
                                              getMainAccount(account),
                                              op.hash,
                                              timeoutMs ? { timeoutMs } : {},
                                            );
                                            l(
                                              `✔️ transaction confirmed on-chain (hash: ${op.hash})`,
                                            );
                                          }
                                          return op;
                                        }),
                                    );
                                  }

                                  return of(e);
                                }),
                              ]),
                          ...(opts["ignore-errors"]
                            ? [
                                catchError(e => {
                                  return of({
                                    type: "error",
                                    error: e,
                                    transaction: t,
                                  });
                                }),
                              ]
                            : []),
                        );
                    }),
                  ),
                ),
              EMPTY as Observable<any>,
            ),
          ),
          mergeMap(obj => (opts.format !== "json" ? EMPTY : of(JSON.stringify(obj)))),
        ),
      ),
    );
  },
};
