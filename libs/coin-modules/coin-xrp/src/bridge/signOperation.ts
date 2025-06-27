import { Observable } from "rxjs";
import { encode } from "ripple-binary-codec";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { AccountBridge, Operation } from "@ledgerhq/types-live";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { craftTransaction, getNextValidSequence, removeCachedRecipientIsNew } from "../logic";
import { Transaction, XrpSignature, XrpSigner } from "../types";

export const buildSignOperation =
  (signerContext: SignerContext<XrpSigner>): AccountBridge<Transaction>["signOperation"] =>
  ({ account, deviceId, transaction }) =>
    new Observable(o => {
      removeCachedRecipientIsNew(transaction.recipient);

      async function main() {
        const { fee } = transaction;
        if (!fee) throw new FeeNotLoaded();

        try {
          o.next({
            type: "device-signature-requested",
          });

          const nextSequenceNumber = await getNextValidSequence(account.freshAddress);

          const signature = await signerContext(deviceId, async signer => {
            const { freshAddressPath: derivationPath } = account;
            const { publicKey } = await signer.getAddress(derivationPath);

            const { xrplTransaction, serializedTransaction } = await craftTransaction(
              {
                address: account.freshAddress,
                nextSequenceNumber,
              },
              {
                recipient: transaction.recipient,
                amount: BigInt(transaction.amount.toString()),
                fee: BigInt(fee.toString()),
                destinationTag: transaction.tag,
              },
              publicKey,
            );

            const transactionSignature = await signer.signTransaction(
              derivationPath,
              serializedTransaction,
            );

            return encode({
              ...xrplTransaction,
              SigningPubKey: publicKey,
              TxnSignature: transactionSignature,
            }).toUpperCase() as XrpSignature;
          });

          o.next({
            type: "device-signature-granted",
          });

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
