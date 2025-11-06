import { Observable } from "rxjs";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Account, DeviceId, SignOperationEvent, AccountBridge } from "@ledgerhq/types-live";
import { getAlpacaApi } from "./alpaca";
import { buildOptimisticOperation, transactionToIntent } from "./utils";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { Result } from "@ledgerhq/coin-framework/derivation";
import { MapMemo, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { StellarMemo } from "@ledgerhq/coin-stellar/types/bridge";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { GenericTransaction } from "./types";

/**
 * Applies memo information to transaction intent
 * Handles both destination tags (XRP-like) and Stellar-style memos
 */
function applyMemoToIntent(
  transactionIntent: TransactionIntent<any>,
  transaction: GenericTransaction,
): TransactionIntent<any> {
  // Handle destination tag memo (for XRP-like chains)
  if (transaction.tag) {
    const txWithMemoTag = transactionIntent as TransactionIntent<MapMemo<string, string>>;
    const txMemo = String(transaction.tag);

    txWithMemoTag.memo = {
      type: "map",
      memos: new Map(),
    };
    txWithMemoTag.memo.memos.set("destinationTag", txMemo);

    return txWithMemoTag;
  }

  // Handle Stellar-style memo
  if (transaction.memoType && transaction.memoValue) {
    const txWithMemo = transactionIntent as TransactionIntent<StellarMemo>;
    const txMemoType = String(transaction.memoType);
    const txMemoValue = String(transaction.memoValue);

    txWithMemo.memo = {
      type: txMemoType as "NO_MEMO" | "MEMO_TEXT" | "MEMO_ID" | "MEMO_HASH" | "MEMO_RETURN",
      value: txMemoValue,
    };

    return txWithMemo;
  }

  return transactionIntent;
}

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
          };
          const { amount } = await alpacaApi.validateIntent(
            transactionToIntent(account, draftTransaction, alpacaApi.computeIntentType),
            { value: fees },
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

          if (typeof transactionIntent.sequence !== "bigint") {
            // TODO: should compute it and pass it down to craftTransaction (duplicate call right now)
            const sequenceNumber = await alpacaApi.getSequence(transactionIntent.sender);
            transactionIntent.sequence = sequenceNumber;
          }

          /* Craft unsigned blob via Alpaca */
          const { transaction: unsigned } = await alpacaApi.craftTransaction(transactionIntent, {
            value: fees,
          });

          /* Notify UI that the device is now showing the tx */
          o.next({ type: "device-signature-requested" });
          /* Sign on Ledger device */
          const txnSig = await signer.signTransaction(derivationPath, unsigned);
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
