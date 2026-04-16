import { FeeNotLoaded } from "@ledgerhq/errors";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { AccountBridge, Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import { craftTransaction } from "../logic";
import { getNonce } from "../network/node";
import { Transaction, TempoSigner } from "../types";

export const buildSignOperation =
  (signerContext: SignerContext<TempoSigner>): AccountBridge<Transaction>["signOperation"] =>
  ({ account, deviceId, transaction }) =>
    new Observable(o => {
      async function main() {
        const { fee } = transaction;
        if (!fee) throw new FeeNotLoaded();

        try {
          o.next({
            type: "device-signature-requested",
          });

          const nonce = await getNonce(account.freshAddress);

          const signature = await signerContext(deviceId, async signer => {
            const { freshAddressPath: derivationPath } = account;

            const { serializedTransaction } = await craftTransaction(
              {
                address: account.freshAddress,
                nonce,
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

            return transactionSignature;
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
            transactionSequenceNumber: new BigNumber(nonce),
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
