import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { Bip32PublicKey } from "@stricahq/bip32ed25519";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { AccountBridge, SignOperationEvent } from "@ledgerhq/types-live";
import { Transaction as TyphonTransaction, types as TyphonTypes } from "@stricahq/typhonjs";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import type { CardanoAccount, Transaction } from "./types";
import { getExtendedPublicKeyFromHex } from "./logic";
import { buildTransaction } from "./buildTransaction";
import { getNetworkParameters } from "./networks";
import { CardanoSigner, Witness } from "./signer";
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
        const signed = signTx(unsignedTransaction, accountPubKey, signedData.witnesses);

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

/**
 * Adds signatures to unsigned transaction
 */
const signTx = (
  unsignedTransaction: TyphonTransaction,
  accountKey: Bip32PublicKey,
  witnesses: Array<Witness>,
) => {
  witnesses.forEach(witness => {
    const [, , , chainType, index] = witness.path;
    const publicKey = accountKey.derive(chainType).derive(index).toPublicKey().toBytes();
    const vKeyWitness: TyphonTypes.VKeyWitness = {
      signature: Buffer.from(witness.witnessSignatureHex, "hex"),
      publicKey: Buffer.from(publicKey),
    };
    unsignedTransaction.addWitness(vKeyWitness);
  });

  return unsignedTransaction.buildTransaction();
};
