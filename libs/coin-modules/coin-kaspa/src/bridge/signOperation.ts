import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { SignOperationEvent } from "@ledgerhq/types-live";

import type { Transaction } from "../types";

import { buildTransaction } from "./buildTransaction";
import { KaspaAccount } from "../types/bridge";
import { KaspaSigner } from "../signer";
import { SignerContext } from "@ledgerhq/coin-framework/lib/signer";

// @ts-ignore
/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (
    signerContext: SignerContext<KaspaSigner>
  ): AccountBridge<Transaction, KaspaAccount>["signOperation"] =>
    ({ account, deviceId, transaction }): Observable<SignOperationEvent> =>
      new Observable(o => {
        async function main() {
          o.next({
            type: "device-signature-requested"
          });

          if (!transaction.fees) {
            throw new FeeNotLoaded();
          }

          const unsigned = await buildTransaction(account, transaction);

          // Sign by device
          const r = await signerContext(deviceId, signer =>
            signer.signTransaction(
              account.freshAddressPath,
              unsigned
            );
        )
          ;

          const signed = signTx(unsigned, r.signature);

          o.next({ type: "device-signature-granted" });

          const operation = buildOptimisticOperation(
            account,
            transaction,
            transaction.fees ?? BigNumber(0)
          );

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature: signed,
              expirationDate: null
            }
          });
        }

        main().then(
          () => o.complete(),
          (e) => o.error(e)
        );
      });