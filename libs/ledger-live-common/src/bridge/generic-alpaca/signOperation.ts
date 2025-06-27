import { Observable } from "rxjs";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type {
  Account,
  DeviceId,
  SignOperationEvent,
  AccountBridge,
  TransactionCommon,
} from "@ledgerhq/types-live";
import { getAlpacaApi } from "./alpaca";
import { buildOptimisticOperation, transactionToIntent } from "./utils";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { Result } from "@ledgerhq/coin-framework/derivation";
import { MapMemo, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { StellarMemo } from "@ledgerhq/coin-stellar/lib/types/bridge";
import BigNumber from "bignumber.js";

/**
 * Sign Transaction with Ledger hardware
 */
export const genericSignOperation =
  (network, kind) =>
  (signerContext: SignerContext<any>): AccountBridge<TransactionCommon>["signOperation"] =>
  ({
    account,
    transaction,
    deviceId,
  }: {
    account: Account;
    transaction: TransactionCommon;
    deviceId: DeviceId;
  }): Observable<SignOperationEvent> =>
    new Observable(o => {
      async function main() {
        console.log("genericSignOperation transaction ", transaction);
        // NOTE: checking field that's not inside TransactionCommon, improve
        if (!transaction["fees"]) throw new FeeNotLoaded();

        // debugger;
        if (transaction["useAllAmount"]) {
          const {
            freshAddress,
            balance,
            currency,
            pendingOperations,
            subAccounts,
            spendableBalance,
          } = account;
          // let { spendableBalance } = account;

          // if (subAccounts && transaction?.subAccountId) {
          //   spendableBalance =
          //     subAccounts.find(t => t.id === transaction.subAccountId)?.spendableBalance ||
          //     new BigNumber(0);
          // }
          // FIXME: fix this one also (hardcoded type)

          // debugger;
          const { amount } = await getAlpacaApi(network, kind).validateIntent(
            {
              currencyName: currency.name,
              address: freshAddress,
              balance: BigInt(balance.toString()),
              currencyUnit: currency.units[0],
              pendingOperations: pendingOperations.length,
              spendableBalance: BigInt(spendableBalance.toString()),
              subAccount: subAccounts
                ? subAccounts.find(t => t.id === transaction.subAccountId)
                : undefined,
            },
            {
              type: "PAYMENT",
              recipient: transaction.recipient,
              amount: BigInt(transaction.amount?.toString() ?? "0"),
              fee: BigInt(transaction["fees"]?.toString() ?? "0"),
              useAllAmount: !!transaction.useAllAmount,
              assetCode: transaction?.["assetCode"] || "",
              assetIssuer: transaction?.["assetIssuer"] || "",
              subAccountId: transaction.subAccountId || "",
            },
          );
          transaction.amount = new BigNumber(amount.toString());
        }
        console.log("THE AMOUTN: ", transaction.amount.toString());
        const signedInfo = await signerContext(deviceId, async signer => {
          const derivationPath = account.freshAddressPath;

          const { publicKey } = (await signer.getAddress(derivationPath)) as Result;

          const transactionIntent = transactionToIntent(account, transaction);
          transactionIntent.senderPublicKey = publicKey;
          // NOTE: is setting the memo here instead of transactionToIntent sensible?
          const txWithMemoTag = transactionIntent as TransactionIntent<
            any,
            MapMemo<string, string>
          >;
          if (transaction["tag"]) {
            const txMemo = String(transaction["tag"]);
            txWithMemoTag.memo = {
              type: "map",
              memos: new Map(),
            };
            txWithMemoTag.memo.memos.set("destinationTag", txMemo);
          }
          const txWithMemo = transactionIntent as TransactionIntent<any, StellarMemo>;
          if (transaction["memoType"] && transaction["memoValue"]) {
            const txMemoType = String(transaction["memoType"]);
            const txMemoValue = String(transaction["memoValue"]);
            txWithMemo.memo = {
              type: txMemoType as "NO_MEMO" | "MEMO_TEXT" | "MEMO_ID" | "MEMO_HASH" | "MEMO_RETURN",
              value: txMemoValue,
            };
          }
          console.log("111111111111: ", transactionIntent);
          const txWithAsset = transactionIntent as TransactionIntent<any>;
          if (transaction["assetCode"] && transaction["assetIssuer"]) {
            txWithAsset.asset = {
              type: "token",
              assetCode: transaction["assetCode"],
              assetIssuer: transaction["assetIssuer"],
            };
            // txWithMemo.asset.set("destinationTag", txMemo);
          } else {
            txWithAsset.asset = {
              type: "native",
            };
          }
          console.log("2222222222222: ", transactionIntent);

          /* Craft unsigned blob via Alpaca */
          const unsigned: string = await getAlpacaApi(network, kind).craftTransaction(
            transactionIntent,
          );

          // TODO: should compute it and pass it down to craftTransaction (duplicate call right now)
          const accountInfo = await getAlpacaApi(network, kind).getAccountInfo(
            transactionIntent.sender,
          );
          const sequenceNumber = accountInfo.sequence;
          console.log("33333333333333");
          console.log("transaction:", transaction);
          // console.log("unsigned:", unsigned);
          /* Notify UI that the device is now showing the tx */
          o.next({ type: "device-signature-requested" });
          /* Sign on Ledger device */
          const txnSig = await signer.signTransaction(derivationPath, unsigned);
          return { unsigned, txnSig, publicKey, sequence: sequenceNumber };
        });

        /* If the user cancelled inside signerContext */
        if (!signedInfo) return;
        o.next({ type: "device-signature-granted" });
        console.log("444444444444");

        /* Combine payload + signature for broadcast */
        const combined = await getAlpacaApi(network, kind).combine(
          signedInfo.unsigned,
          signedInfo.txnSig,
          signedInfo.publicKey,
        );
        console.log("SHVSFHGSFCGHS: ", transaction);

        const operation = buildOptimisticOperation(account, transaction, signedInfo.sequence);
        console.log("END");

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
