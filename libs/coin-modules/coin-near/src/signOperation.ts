import * as nearAPI from "near-api-js";
import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Account, DeviceId, SignOperationEvent, AccountBridge } from "@ledgerhq/types-live";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { buildTransaction } from "./buildTransaction";
import type { Transaction } from "./types";
import { NearSigner } from "./signer";

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (signerContext: SignerContext<NearSigner>): AccountBridge<Transaction>["signOperation"] =>
  ({
    account,
    transaction,
    deviceId,
  }: {
    account: Account;
    transaction: Transaction;
    deviceId: DeviceId;
  }): Observable<SignOperationEvent> =>
    new Observable(o => {
      async function main() {
        o.next({ type: "device-signature-requested" });

        if (!transaction.fees) {
          throw new FeeNotLoaded();
        }

        const { publicKey } = await signerContext(deviceId, signer =>
          signer.getAddress(account.freshAddressPath),
        );
        const unsigned = await buildTransaction(account, transaction, publicKey);

        const response = await signerContext(deviceId, signer =>
          signer.signTransaction(unsigned.encode(), account.freshAddressPath),
        );

        const signedTransaction = new nearAPI.transactions.SignedTransaction({
          transaction: unsigned,
          signature: new nearAPI.transactions.Signature({
            keyType: unsigned.publicKey.keyType,
            data: response,
          }),
        });

        o.next({ type: "device-signature-granted" });

        const operation = buildOptimisticOperation(
          account,
          transaction,
          transaction.fees ?? new BigNumber(0),
        );
        const signedSerializedTx = signedTransaction.encode();

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: Buffer.from(signedSerializedTx).toString("base64"),
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });

export default buildSignOperation;
