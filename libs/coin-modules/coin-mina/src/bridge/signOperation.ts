import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type {
  Account,
  DeviceId,
  SignOperationEvent,
  OperationType,
  AccountBridge,
} from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { Observable } from "rxjs";
import { reEncodeRawSignature } from "../common-logic";
import type { MinaOperation, MinaSignedTransaction, Transaction } from "../types/common";
import { MinaSignature, MinaSigner } from "../types/signer";
import { buildTransaction } from "./buildTransaction";

export const buildOptimisticOperation = (
  account: Account,
  transaction: Transaction,
  fee: BigNumber,
): MinaOperation => {
  let value = new BigNumber(transaction.amount).plus(fee);

  if (transaction.fees?.accountCreationFee.gt(0)) {
    value = value.minus(transaction.fees.accountCreationFee);
  }

  const type: OperationType = "OUT";

  const operation: MinaOperation = {
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
    date: new Date(),
    extra: {
      memo: transaction.memo,
      accountCreationFee: transaction.fees.accountCreationFee.toString(),
    },
  };

  return operation;
};

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (signerContext: SignerContext<MinaSigner>): AccountBridge<Transaction>["signOperation"] =>
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
      async function main() {
        o.next({ type: "device-signature-requested" });

        if (!transaction.fees) {
          throw new FeeNotLoaded();
        }

        const unsigned = await buildTransaction(account, transaction);

        const { signature } = (await signerContext(deviceId, signer =>
          signer.signTransaction(unsigned),
        )) as MinaSignature;
        invariant(signature, "signature should be defined if user accepted");
        const encodedSignature = reEncodeRawSignature(signature);

        const signedTransaction: MinaSignedTransaction = {
          transaction: unsigned,
          signature: encodedSignature,
        };

        o.next({ type: "device-signature-granted" });

        const operation = buildOptimisticOperation(
          account,
          transaction,
          transaction.fees.fee ?? new BigNumber(0),
        );
        const signedSerializedTx = JSON.stringify(signedTransaction);

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: signedSerializedTx,
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });

export default buildSignOperation;
