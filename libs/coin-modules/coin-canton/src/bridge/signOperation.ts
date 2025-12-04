import { decodeAccountId } from "@ledgerhq/coin-framework/account";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { AccountBridge, Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import { combine, craftTransaction } from "../common-logic";
import { signTransaction } from "../common-logic/transaction/sign";
import { CantonSigner, Transaction } from "../types";

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

            const { nativeTransaction, serializedTransaction } = await craftTransaction(
              account.currency,
              {
                address,
              },
              params,
            );

            const signatureResult = await signTransaction(
              signer,
              derivationPath,
              nativeTransaction,
            );

            return combine(
              serializedTransaction,
              `${signatureResult.signature}__PARTY__${address}`,
            );
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
            const errorMessage =
              (e as Error & { data?: { resultMessage?: string } })?.data?.resultMessage ||
              e.message;
            throw new Error(errorMessage);
          }

          throw e;
        }
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
