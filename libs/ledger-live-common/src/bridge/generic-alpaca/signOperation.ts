import { Observable } from "rxjs";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Account, DeviceId, SignOperationEvent, AccountBridge } from "@ledgerhq/types-live";
import { getAlpacaApi } from "./alpaca";
import { applyMemoToIntent, buildOptimisticOperation, transactionToIntent } from "./utils";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { Result } from "@ledgerhq/coin-framework/derivation";
import { TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { GenericTransaction } from "./types";

/**
 * Enriches transaction intent with memo and asset information
 */
function enrichTransactionIntent(
  transactionIntent: TransactionIntent<any>,
  transaction: GenericTransaction,
  publicKey: string,
): TransactionIntent<any> {
  // Set sender public key
  transactionIntent.senderPublicKey = publicKey;

  // Apply memo information
  transactionIntent = applyMemoToIntent(transactionIntent, transaction);

  return transactionIntent;
}
/**
 * Sign Transaction with Ledger hardware
 */
export const genericSignOperation =
  (network, kind) =>
  (signerContext: SignerContext<any>): AccountBridge<GenericTransaction>["signOperation"] =>
  ({
    account,
    transaction,
    deviceId,
  }: {
    account: Account;
    transaction: GenericTransaction;
    deviceId: DeviceId;
  }): Observable<SignOperationEvent> =>
    new Observable(o => {
      async function main() {
        const alpacaApi = getAlpacaApi(account.currency.id, kind);
        if (!transaction.fees) throw new FeeNotLoaded();
        const fees = BigInt(transaction.fees?.toString() || "0");
        const feesParameters = {
          ...(transaction.gasLimit ? { gasLimit: BigInt(transaction.gasLimit.toFixed()) } : {}),
          ...(transaction.gasPrice ? { gasPrice: BigInt(transaction.gasPrice.toFixed()) } : {}),
          ...(transaction.maxFeePerGas
            ? { maxFeePerGas: BigInt(transaction.maxFeePerGas.toFixed()) }
            : {}),
          ...(transaction.maxPriorityFeePerGas
            ? { maxPriorityFeePerGas: BigInt(transaction.maxPriorityFeePerGas.toFixed()) }
            : {}),
          ...(transaction.additionalFees
            ? { additionalFees: BigInt(transaction.additionalFees.toFixed()) }
            : {}),
        };
        if (transaction.useAllAmount) {
          const draftTransaction = {
            mode: transaction.mode,
            recipient: transaction.recipient,
            amount: transaction.amount ?? 0,
            useAllAmount: !!transaction.useAllAmount,
            assetReference: transaction?.assetReference || "",
            assetOwner: transaction?.assetOwner || "",
            subAccountId: transaction.subAccountId || "",
            family: transaction.family,
            feesStrategy: transaction.feesStrategy,
            data: transaction.data,
            type: transaction.type,
          };
          // TODO Remove the call to `validateIntent` https://ledgerhq.atlassian.net/browse/LIVE-22227
          const { amount } = await alpacaApi.validateIntent(
            transactionToIntent(account, draftTransaction, alpacaApi.computeIntentType),
            { value: fees, parameters: feesParameters },
          );
          transaction.amount = new BigNumber(amount.toString());
        }
        const signedInfo = await signerContext(deviceId, async signer => {
          const derivationPath = account.freshAddressPath;
          const { publicKey } = (await signer.getAddress(derivationPath)) as Result;

          let transactionIntent = transactionToIntent(
            account,
            { ...transaction },
            alpacaApi.computeIntentType,
          );
          transactionIntent.senderPublicKey = publicKey;

          // Enrich with memo and asset information
          transactionIntent = enrichTransactionIntent(transactionIntent, transaction, publicKey);

          if (typeof transactionIntent.sequence !== "bigint" || transactionIntent.sequence < 0n) {
            // TODO: should compute it and pass it down to craftTransaction (duplicate call right now)
            const sequenceNumber = await alpacaApi.getSequence(transactionIntent.sender);
            transactionIntent.sequence = sequenceNumber;
          }

          /* Craft unsigned blob via Alpaca */
          const { transaction: unsigned } = await alpacaApi.craftTransaction(transactionIntent, {
            value: fees,
            parameters: feesParameters,
          });

          /* Notify UI that the device is now showing the tx */
          o.next({ type: "device-signature-requested" });
          /* Sign on Ledger device */
          const txnSig = await signer.signTransaction(
            derivationPath,
            unsigned,
            transaction.recipientDomain,
          );
          return { unsigned, txnSig, publicKey, sequence: transactionIntent.sequence };
        });

        /* If the user cancelled inside signerContext */
        if (!signedInfo) return;
        o.next({ type: "device-signature-granted" });

        /* Combine payload + signature for broadcast */
        const combined = await alpacaApi.combine(
          signedInfo.unsigned,
          signedInfo.txnSig,
          signedInfo.publicKey,
        );
        const operation = buildOptimisticOperation(account, transaction, signedInfo.sequence);
        if (!operation.id) {
          log("Generic alpaca", "buildOptimisticOperation", operation);
        }
        // NOTE: we set the transactionSequenceNumber before on the operation
        // now that we create it in craftTransaction, we might need to return it back from craftTransaction also
        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: combined,
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
