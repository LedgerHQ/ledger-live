import { FeeNotLoaded } from "@ledgerhq/errors";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { AccountBridge, SignOperationEvent } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { buildTransaction } from "./buildTransaction";
import { CardanoInvalidProtoParams } from "./errors";
import { assembleWitnesses } from "./logic/assembleWitnesses";
import { getExtendedPublicKeyFromHex } from "./logic";
import { getNetworkParameters } from "./networks";
import { CardanoSigner } from "./signer";
import type { CardanoAccount, Transaction } from "./types";
import typhonSerializer from "./typhonSerializer";

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (
    signerContext: SignerContext<CardanoSigner>,
  ): AccountBridge<Transaction, CardanoAccount>["signOperation"] =>
  ({ account, deviceId, transaction }): Observable<SignOperationEvent> =>
    new Observable(o => {
      async function main() {
        o.next({ type: "device-signature-requested" });

        if (!transaction.fees) {
          throw new FeeNotLoaded();
        }

        if (!transaction.protocolParams) {
          throw new CardanoInvalidProtoParams();
        }

        const unsignedTransaction = await buildTransaction(account, transaction);
        const signerTransaction = typhonSerializer(unsignedTransaction, account.index);

        const networkParams = getNetworkParameters(account.currency.id);
        const signedData = await signerContext(deviceId, signer =>
          signer.sign({
            transaction: signerTransaction,
            networkParams,
          }),
        );

        const accountPubKey = getExtendedPublicKeyFromHex(account.xpub as string);
        const signed = assembleWitnesses(unsignedTransaction, accountPubKey, signedData.witnesses);

        o.next({ type: "device-signature-granted" });

        const operation = buildOptimisticOperation(account, unsignedTransaction, transaction);

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: signed.payload,
          },
        });
      }
      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
