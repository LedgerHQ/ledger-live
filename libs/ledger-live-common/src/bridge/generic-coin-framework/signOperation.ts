import { Observable } from "rxjs";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Account, DeviceId, SignOperationEvent, AccountBridge } from "@ledgerhq/types-live";
import { getCoinModuleApi } from "./api";
import { getBridgeApi } from "./bridge";
import {
  bigNumberToBigIntDeep,
  buildOptimisticOperation,
  extractBalances,
  transactionToIntent,
} from "./utils";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { type GetAddressResult } from "@ledgerhq/ledger-wallet-framework/derivation";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { GenericTransaction } from "./types";

/**
 * Sign Transaction with Ledger hardware
 */
export const genericSignOperation =
  (network: string, kind: string) =>
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
        const coinModuleApi = await getCoinModuleApi(account.currency.id, kind);
        const bridgeApi = await getBridgeApi(account.currency, network);
        if (!transaction.fees) throw new FeeNotLoaded();
        const customFees = bigNumberToBigIntDeep({
          value: transaction.fees ?? new BigNumber(0),
          parameters: {
            gasLimit: transaction.customGasLimit ?? transaction.gasLimit,
            gasPrice: transaction.gasPrice,
            maxFeePerGas: transaction.maxFeePerGas,
            maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
            additionalFees: transaction.additionalFees,
          },
        });
        if (transaction.useAllAmount) {
          const draftTransaction = {
            mode: transaction.mode,
            recipient: transaction.recipient,
            amount: transaction.amount ?? 0,
            useAllAmount: !!transaction.useAllAmount,
            assetReference: transaction?.assetReference || "",
            assetOwner: transaction?.assetOwner || "",
            subAccountId: transaction.subAccountId || "",
            memoType: transaction.memoType || "",
            memoValue: transaction.memoValue || "",
            tag: transaction.tag,
            family: transaction.family,
            feesStrategy: transaction.feesStrategy,
            data: transaction.data,
            type: transaction.type,
            sponsored: transaction.sponsored,
            valAddress: transaction?.valAddress || "",
            valId: transaction?.valId,
            dstValAddress: transaction?.dstValAddress || "",
          };
          // TODO Remove the call to `validateIntent` https://ledgerhq.atlassian.net/browse/LIVE-22227
          const { amount } = await coinModuleApi.validateIntent(
            transactionToIntent(
              account,
              draftTransaction,
              bridgeApi.computeIntentType,
              coinModuleApi.craftTransactionData,
            ),
            extractBalances(account, bridgeApi.getAssetFromToken),
            customFees,
          );
          transaction.amount = new BigNumber(amount.toString());
        }
        const signedInfo = await signerContext(deviceId, async signer => {
          const derivationPath = account.freshAddressPath;
          const { publicKey } = (await signer.getAddress(derivationPath, {
            derivationMode: account.derivationMode,
          })) as GetAddressResult;

          const transactionIntent = transactionToIntent(
            account,
            { ...transaction },
            bridgeApi.computeIntentType,
            coinModuleApi.craftTransactionData,
          );
          transactionIntent.senderPublicKey = publicKey;

          if (typeof transactionIntent.sequence !== "bigint" || transactionIntent.sequence < 0n) {
            // TODO: should compute it and pass it down to craftTransaction (duplicate call right now)
            const sequenceNumber = await coinModuleApi.getNextSequence(transactionIntent.sender);
            transactionIntent.sequence = sequenceNumber;
          }

          /* Craft unsigned blob via coin-framework */
          const { transaction: unsigned } = await coinModuleApi.craftTransaction(
            transactionIntent,
            customFees,
          );

          /* Notify UI that the device is now showing the tx */
          o.next({ type: "device-signature-requested" });
          /* Sign on Ledger device */
          const txnSig = await signer.signTransaction(derivationPath, unsigned, {
            ...transaction.recipientDomain,
            derivationMode: account.derivationMode,
          });
          return {
            unsigned,
            txnSig,
            publicKey,
            sequence: transactionIntent.sequence,
          };
        });

        /* If the user cancelled inside signerContext */
        if (!signedInfo) return;
        o.next({ type: "device-signature-granted" });

        /* Combine payload + signature for broadcast */
        const combined = await coinModuleApi.combine(
          signedInfo.unsigned,
          signedInfo.txnSig,
          signedInfo.publicKey,
        );
        const operation = buildOptimisticOperation(account, transaction, signedInfo.sequence);
        if (!operation.id) {
          log("Generic coin-framework", "buildOptimisticOperation", operation);
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
