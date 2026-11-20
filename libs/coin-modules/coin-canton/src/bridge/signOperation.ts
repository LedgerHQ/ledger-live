import { FeeNotLoaded } from "@ledgerhq/ledger-wallet-framework/errors";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { AccountBridge, Operation } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { combine } from "../logic/combine";
import { craftTransaction } from "../logic/craftTransaction";
import { createFrameworkSigner } from "../signer/frameworkSigner";
import type { CantonContext } from "../config";
import { CantonMemo, CantonSigner, Transaction } from "../types";
import { pinConfig } from "./context";

// A native transfer carrying an admin stays token-shaped, so the gateway still receives that admin.
function toTransferIntent(
  transaction: Transaction,
  party: string,
  nativeInstrumentId: string,
): TransactionIntent<CantonMemo> {
  const { tokenId, instrumentAdmin, memo } = transaction;
  const isNative = !instrumentAdmin && tokenId === nativeInstrumentId;
  return {
    intentType: "transaction",
    type: "send",
    sender: party,
    recipient: transaction.recipient,
    amount: BigInt(transaction.amount.toFixed()),
    asset: isNative
      ? { type: "native" }
      : {
          type: "token",
          assetReference: tokenId,
          ...(instrumentAdmin ? { assetOwner: instrumentAdmin } : {}),
        },
    ...(transaction.expireInSeconds === undefined
      ? {}
      : { expiration: transaction.expireInSeconds }),
    ...(memo ? { memo: { type: "string", kind: "reason", value: memo } } : {}),
  };
}

export const buildSignOperation =
  (
    signerContext: SignerContext<CantonSigner>,
    context: CantonContext,
  ): AccountBridge<Transaction>["signOperation"] =>
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

          let transactionHash = "";
          const signature = await signerContext(deviceId, async signer => {
            const { id, freshAddressPath: derivationPath, xpub } = account;
            const config = await context.config(account.currency.id);
            // One snapshot, so crafting maps the native asset with the id the intent was built from.
            const pinnedContext = pinConfig(context, config);
            const party = xpub ?? decodeAccountId(id).xpubOrAddress;

            const { transaction: crafted, details } = await craftTransaction(
              pinnedContext,
              toTransferIntent(transaction, party, config.nativeInstrumentId),
            );
            transactionHash = details.hash || "";

            const deviceSignature = await createFrameworkSigner(signer).signTransaction(
              derivationPath,
              crafted,
            );
            return combine(crafted, [deviceSignature]);
          });

          o.next({
            type: "device-signature-granted",
          });

          // We create an optimistic operation here, the framework will then replace this transaction with the one returned by the indexer
          const hash = transactionHash;
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
