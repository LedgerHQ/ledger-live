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
import { log } from "@ledgerhq/logs";

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
      let cancelled = false;
      let inProgress = false;
      async function main() {
        log("xrp-debug", "🟢 signOperation main() started");
        if (inProgress || cancelled) {
          log("xrp-debug", "🔁 Aborted: Already in progress or cancelled");
          return;
        }
        inProgress = true;
        if (!transaction["fees"]) throw new FeeNotLoaded();
        try {
          /////

          log("xrp-debug", `cancelled = ${cancelled}`);
          if (cancelled) {
            return;
          }
          const signedInfo = await signerContext(deviceId, async signer => {
            const derivationPath = account.freshAddressPath;

            const { publicKey } = (await signer.getAddress(derivationPath)) as Result;

            const transactionIntent = transactionToIntent(account, transaction);
            transactionIntent.senderPublicKey = publicKey;
            // NOTE: is setting the memo here instead of transactionToIntent sensible?
            const txWithMemo = transactionIntent as TransactionIntent<any, MapMemo<string, string>>;
            if (transaction["tag"]) {
              const txMemo = String(transaction["tag"]);
              txWithMemo.memo = {
                type: "map",
                memos: new Map(),
              };
              txWithMemo.memo.memos.set("destinationTag", txMemo);
            }

            /* Craft unsigned blob via Alpaca */
            const unsigned: string = await getAlpacaApi(network, kind).craftTransaction(
              transactionIntent,
            );

            // TODO: should compute it and pass it down to craftTransaction (duplicate call right now)
            const accountInfo = await getAlpacaApi(network, kind).getAccountInfo(
              transactionIntent.sender,
            );
            const sequenceNumber = accountInfo.sequence;

            /* Notify UI that the device is now showing the tx */
            o.next({ type: "device-signature-requested" });

            /* Sign on Ledger device */
            const txnSig = await signer.signTransaction(derivationPath, unsigned);

            return { unsigned, txnSig, publicKey, sequence: sequenceNumber };
          });

          /* If the user cancelled inside signerContext */
          if (!signedInfo) return;
          o.next({ type: "device-signature-granted" });

          /* Combine payload + signature for broadcast */
          const combined = await getAlpacaApi(network, kind).combine(
            signedInfo.unsigned,
            signedInfo.txnSig,
            signedInfo.publicKey,
          );

          const operation = buildOptimisticOperation(account, transaction, signedInfo.sequence);
          log("xrp-debug", "✅ signOperation main() operation built", { operation, transaction });
          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature: combined,
            },
          });
        } catch (e) {
          log("xrp-debug", `catched an error ${e}`);
          if (e instanceof Error) {
            throw new Error(
              (e as Error & { data?: { resultMessage?: string } })?.data?.resultMessage,
            );
          }

          throw e;
        }
        log("xrp-debug", "✅ signOperation main() completed");
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );

      return () => {
        log("xrp-debug", "signOperation cancelled");
        cancelled = true;
      };
    });
