import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { AccountBridge, Operation } from "@ledgerhq/types-live";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { combine, craftTransaction, getNextValidSequence } from "../common-logic";
import { Transaction, BoilerplateSigner, BoilerplateNativeTransaction } from "../types";

export const buildSignOperation =
  (signerContext: SignerContext<BoilerplateSigner>): AccountBridge<Transaction>["signOperation"] =>
  ({ account, deviceId, transaction }) =>
    new Observable(o => {
      async function main() {
        const { fee } = transaction;
        if (!fee) throw new FeeNotLoaded();

        try {
          // o observables allows to define steps of the signing process with the device
          o.next({
            type: "device-signature-requested",
          });

          const nextSequenceNumber = await getNextValidSequence(account.freshAddress);

          const signature = await signerContext(deviceId, async signer => {
            const { freshAddressPath: derivationPath } = account;
            const { publicKey } = await signer.getAddress(derivationPath);

            const { nativeTransaction, serializedTransaction } = await craftTransaction(
              {
                address: account.freshAddress,
                publicKey,
              },
              {
                recipient: transaction.recipient,
                amount: transaction.amount,
                fee: fee,
              },
            );

            const transactionSignature = await signer.signTransaction(
              derivationPath,
              serializedTransaction,
            );

            return combine(serializedTransaction, transactionSignature, publicKey);
          });

          o.next({
            type: "device-signature-granted",
          });

          // We create an optimistic operation here, the framework will then replace this transaction with the one returned by the indexer
          const hash = "";
          const operation: Operation = {
            id: encodeOperationId(account.id, hash, "OUT"),
            hash,
            accountId: account.id,
            type: "OUT",
            value: transaction.amount,
            fee,
            blockHash: null,
            blockHeight: null,
            senders: [account.freshAddress],
            recipients: [transaction.recipient],
            date: new Date(),
            transactionSequenceNumber: nextSequenceNumber,
            extra: {},
          };

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature,
            },
          });
        } catch (e) {
          if (e instanceof Error) {
            throw new Error(
              (e as Error & { data?: { resultMessage?: string } })?.data?.resultMessage,
            );
          }

          throw e;
        }
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
