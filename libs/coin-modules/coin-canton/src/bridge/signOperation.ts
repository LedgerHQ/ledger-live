import { FeeNotLoaded } from "@ledgerhq/ledger-wallet-framework/errors";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { Account, AccountBridge, Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
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

/**
 * Canton has no nonce. A synced operation takes its ledger offset, far below a timestamp in ms, so the
 * framework never drops a pending operation by sequence: the sync removes it by hash. Distinct per
 * pending operation, so that a send does not replace an earlier one still pending.
 */
export function nextPendingSequenceNumber(account: Account): BigNumber {
  return [
    ...account.pendingOperations,
    ...(account.subAccounts ?? []).flatMap(({ pendingOperations }) => pendingOperations),
  ].reduce(
    (next, { transactionSequenceNumber }) =>
      transactionSequenceNumber?.gte(next) ? transactionSequenceNumber.plus(1) : next,
    new BigNumber(Date.now()),
  );
}

/**
 * The pending operation of a send, shaped as the sync records it, from the asset actually sent. A CC
 * send charges its fee in its value. The parent pays a token send's fee in CC: a FEES operation, with
 * the token's OUT as a sub-operation when the account holds that token account.
 */
export function buildOptimisticOperation(
  account: Account,
  transaction: Transaction,
  fee: BigNumber,
  hash: string,
  nativeInstrumentId: string,
): Operation {
  const party = account.xpub ?? decodeAccountId(account.id).xpubOrAddress;
  const base = {
    hash,
    blockHash: null,
    blockHeight: null,
    senders: [party],
    recipients: [transaction.recipient],
    date: new Date(),
    transactionSequenceNumber: nextPendingSequenceNumber(account),
    extra: {},
  };
  if (transaction.tokenId === nativeInstrumentId) {
    return {
      ...base,
      id: encodeOperationId(account.id, hash, "OUT"),
      accountId: account.id,
      type: "OUT",
      value: transaction.amount.plus(fee),
      fee,
    };
  }
  return {
    ...base,
    id: encodeOperationId(account.id, hash, "FEES"),
    accountId: account.id,
    type: "FEES",
    value: fee,
    fee,
    subOperations: (account.subAccounts ?? [])
      .filter(({ id }) => id === transaction.subAccountId)
      .map(({ id }) => ({
        ...base,
        id: encodeOperationId(id, hash, "OUT"),
        accountId: id,
        type: "OUT",
        value: transaction.amount,
        fee: new BigNumber(0),
      })),
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
          let nativeInstrumentId = "";
          const signature = await signerContext(deviceId, async signer => {
            const { id, freshAddressPath: derivationPath, xpub } = account;
            const config = await context.config(account.currency.id);
            nativeInstrumentId = config.nativeInstrumentId;
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

          const operation = buildOptimisticOperation(
            account,
            transaction,
            fee,
            transactionHash,
            nativeInstrumentId,
          );

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
