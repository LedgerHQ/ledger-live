import { BigNumber } from "bignumber.js";
import { toAccountRaw } from "@ledgerhq/live-common/lib/account";
import {
  toTransactionRaw,
  toSignedOperationRaw,
} from "@ledgerhq/live-common/lib/transaction";
import { listen } from "@ledgerhq/logs";
import { from, defer, concat, EMPTY, Observable } from "rxjs";
import { map, reduce, filter, switchMap, concatMap } from "rxjs/operators";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import type { InferTransactionsOpts } from "../transaction";
import { inferTransactions, inferTransactionsOpts } from "../transaction";
import { SignedOperation } from "@ledgerhq/live-common/lib/types";

const toJS = (obj) => {
  if (typeof obj === "object" && obj) {
    if (Array.isArray(obj)) {
      return "[" + obj.map((o) => toJS(o)).join(", ") + "]";
    }

    if (obj instanceof Error) {
      return `new ${obj.name || "Error"}()`;
    }

    if (BigNumber.isBigNumber(obj)) {
      return `BigNumber("${obj.toFixed()}")`;
    }

    const keys = Object.keys(obj);
    if (keys.length === 0) return "{}";
    return (
      "{\n" +
      keys
        .map((key) => {
          return `  ${key}: ${toJS(obj[key])}`;
        })
        .join(",\n") +
      "\n}"
    );
  }

  if (typeof obj === "string") return `"${obj}"`;
  return String(obj);
};

const toTransactionStatusJS = (status) => toJS(status);

export default {
  description: "Generate a test for transaction (live-common dataset)",
  args: [...scanCommonOpts, ...inferTransactionsOpts],
  job: (opts: ScanCommonOpts & InferTransactionsOpts) =>
    scan(opts).pipe(
      switchMap((account) =>
        from(inferTransactions(account, opts)).pipe(
          concatMap((inferred) =>
            inferred.reduce(
              (acc, [t]) =>
                concat(
                  acc,
                  from(
                    defer(() => {
                      const apdus: string[] = [];
                      const unsubscribe = listen((log) => {
                        if (log.type === "apdu" && log.message) {
                          apdus.push(log.message);
                        }
                      });
                      const bridge = getAccountBridge(account);
                      return bridge
                        .signOperation({
                          account,
                          transaction: t,
                          deviceId: opts.device || "",
                        })
                        .pipe(
                          filter((e) => e.type === "signed"),
                          map((e) => {
                            // FIXME: will always be true because of filter above
                            // but ts can't infer the right type for SignOperationEvent
                            if (e.type === "signed") {
                              return e.signedOperation;
                            }
                          }),
                          concatMap((signedOperation) =>
                            from(
                              bridge
                                .getTransactionStatus(account, t)
                                .then((s) => [signedOperation, s])
                            )
                          ),
                          map(([signedOperation, status]) => {
                            unsubscribe();
                            return `
{
  name: "NO_NAME",
  transaction: fromTransactionRaw(${JSON.stringify(toTransactionRaw(t))}),
  expectedStatus: (account, transaction) => (
    // you can use account and transaction for smart logic. drop the =>fn otherwise
    ${toTransactionStatusJS(status)}
  ),
  // WARNING: DO NOT commit this test publicly unless you're ok with possibility tx could leak out. (do self txs)
  testSignedOperation: (expect, signedOperation) => {
    expect(toSignedOperationRaw(signedOperation)).toMatchObject(${JSON.stringify(
      toSignedOperationRaw(signedOperation as SignedOperation)
    )})
  },
  apdus: \`
${apdus.map((a) => "  " + a).join("\n")}
  \`
}`;
                          })
                        );
                    })
                  )
                ),
              EMPTY as Observable<any>
            )
          ),
          reduce((jsCodes, code) => jsCodes.concat(code), []),
          map(
            (codes) => `{
  name: "${account.name}",
  raw: ${JSON.stringify(
    toAccountRaw({
      ...account,
      operations: [],
      balanceHistory: undefined,
      freshAddresses: [],
    })
  )},
  transactions: [
    ${codes.join(",")}
  ]
  }`
          )
        )
      )
    ),
};
