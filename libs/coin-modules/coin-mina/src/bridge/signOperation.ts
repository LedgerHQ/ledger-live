import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { FeeNotLoaded, UserRefusedOnDevice } from "@ledgerhq/errors";
import type { MinaOperation, MinaSignedTransaction, Transaction } from "../types/common";
import type {
  Account,
  DeviceId,
  SignOperationEvent,
  OperationType,
  AccountBridge,
} from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { MinaSigner } from "../types/signer";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { buildTransaction } from "./buildTransaction";
import { reEncodeRawSignature } from "../common-logic";
import invariant from "invariant";
import { MINA_CANCEL_RETURN_CODE } from "../consts";

export const buildOptimisticOperation = (
  account: Account,
  transaction: Transaction,
  fee: BigNumber,
): MinaOperation => {
  let value = new BigNumber(transaction.amount).plus(fee);

  if (transaction.fees?.accountCreationFee.gt(0)) {
    value = value.minus(transaction.fees.accountCreationFee);
  }

  const type: OperationType = transaction.txType === "stake" ? "DELEGATE" : "OUT";

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

        const { signature, returnCode, message } = await signerContext(deviceId, signer =>
          signer.signTransaction(unsigned),
        );

        if (!signature && returnCode === MINA_CANCEL_RETURN_CODE) {
          throw new UserRefusedOnDevice();
        }

        invariant(signature, `returnCode: ${returnCode}, message: ${message}`);
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
