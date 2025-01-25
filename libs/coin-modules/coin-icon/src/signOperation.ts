import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";

import type { IconAccount, Transaction } from "./types";
import type {
  Account,
  AccountBridge,
  DeviceId,
  Operation,
  SignOperationEvent,
} from "@ledgerhq/types-live";

import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

import { buildTransaction } from "./buildTransaction";
import { calculateAmount, getNonce } from "./logic";
import { FeeNotLoaded } from "@ledgerhq/errors";
import IconService, { IcxTransaction } from "icon-sdk-js";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { IconSignature, IconSigner } from "./signer";
const { IconUtil, IconConverter } = IconService;

const buildOptimisticOperation = (
  account: Account,
  transaction: Transaction,
  fee: BigNumber,
): Operation => {
  const type = "OUT";
  const value = new BigNumber(transaction.amount).plus(fee);
  const operation: Operation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value,
    fee,
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress],
    recipients: [transaction.recipient].filter(Boolean),
    accountId: account.id,
    transactionSequenceNumber: getNonce(account as IconAccount),
    date: new Date(),
    extra: {},
  };

  return operation;
};

/**
 * Adds signature to unsigned transaction. Will likely be a call to Icon SDK
 */
const addSignature = (rawTransaction: IcxTransaction, signature: string) => {
  return {
    rawTransaction: {
      ...rawTransaction,
      signature: signature,
    },
    signature,
  };
};

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (signerContext: SignerContext<IconSigner>): AccountBridge<Transaction>["signOperation"] =>
  ({
    account,
    transaction,
    deviceId,
  }: {
    account: Account;
    transaction: Transaction;
    deviceId: DeviceId;
  }): Observable<SignOperationEvent> =>
    new Observable(o => {
      let cancelled = false;
      async function main() {
        if (!transaction.fees) {
          throw new FeeNotLoaded();
        }

        const transactionToSign = {
          ...transaction,
          amount: calculateAmount({
            account: account as IconAccount,
            transaction: transaction,
          }),
        };
        const { unsigned } = await buildTransaction(
          account as IconAccount,
          transactionToSign,
          transactionToSign.stepLimit,
        );

        o.next({ type: "device-signature-requested" });

        const res = (await signerContext(deviceId, signer =>
          signer.signTransaction(
            account.freshAddressPath,
            IconUtil.generateHashKey(IconConverter.toRawTransaction(unsigned)),
          ),
        )) as IconSignature;

        const signed = addSignature(unsigned, res.signedRawTxBase64);

        if (cancelled) return;
        o.next({ type: "device-signature-granted" });

        if (!signed.signature) {
          throw new Error("No signature");
        }

        const operation = buildOptimisticOperation(
          account,
          transactionToSign,
          transactionToSign.fees ?? new BigNumber(0),
        );

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: signed.signature,
            rawData: signed.rawTransaction,
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );

      return () => {
        cancelled = true;
      };
    });

export default buildSignOperation;
