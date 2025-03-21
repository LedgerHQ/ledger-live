import { Observable } from "rxjs";
import { PublicKey } from "@hashgraph/sdk";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { buildUnsignedTransaction } from "../api/network";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { Transaction, HederaSigner } from "../types";

export const buildSignOperation =
  (
    signerContext: SignerContext<HederaSigner>,
  ): AccountBridge<Transaction, Account>["signOperation"] =>
  ({ account, transaction, deviceId }) =>
    new Observable(o => {
      void (async function () {
        try {
          o.next({
            type: "device-signature-requested",
          });

          const hederaTransaction = await buildUnsignedTransaction({
            account,
            transaction,
          });

          const accountPublicKey = PublicKey.fromString(account.seedIdentifier);

          const res = await signerContext(deviceId, async signer => {
            await hederaTransaction.signWith(accountPublicKey, async bodyBytes => {
              return await signer.signTransaction(bodyBytes);
            });
            return hederaTransaction.toBytes();
          });

          o.next({
            type: "device-signature-granted",
          });

          const operation = await buildOptimisticOperation({
            account,
            transaction,
          });

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              // NOTE: this needs to match the inverse operation in js-broadcast
              signature: Buffer.from(res).toString("base64"),
            },
          });

          o.complete();
        } catch (err) {
          o.error(err);
        }
      })();
    });
