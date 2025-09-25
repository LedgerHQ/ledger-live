import { Observable } from "rxjs";
import BigNumber from "bignumber.js";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { AccountBridge, Operation } from "@ledgerhq/types-live";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { decodeAccountId } from "@ledgerhq/coin-framework/account";
import { combine, craftTransaction } from "../common-logic";
import { Transaction, CantonSigner } from "../types";

export const buildSignOperation =
  (signerContext: SignerContext<CantonSigner>): AccountBridge<Transaction>["signOperation"] =>
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

          const signature = await signerContext(deviceId, async signer => {
            const { id, freshAddressPath: derivationPath, xpub } = account;
            const address = xpub ?? decodeAccountId(id).xpubOrAddress;
            const params: {
              recipient?: string;
              amount: BigNumber;
              tokenId: string;
              expireInSeconds: number;
              memo?: string;
            } = {
              recipient: transaction.recipient,
              amount: transaction.amount,
              expireInSeconds: 60 * 60,
              tokenId: transaction.tokenId,
            };
            if (transaction.memo) {
              params.memo = transaction.memo;
            }

            const { hash, serializedTransaction } = await craftTransaction(
              account.currency,
              {
                address,
              },
              params,
            );
            const transactionSignature = await signer.signTransaction(derivationPath, hash);

            return combine(serializedTransaction, `${transactionSignature}__PARTY__${address}`);
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
