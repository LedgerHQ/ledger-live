import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { FeeNotLoaded, UserRefusedOnDevice } from "@ledgerhq/errors";
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
import { MINA_CANCEL_RETURN_CODE } from "../consts";
import type { MinaOperation, MinaSignedTransaction, Transaction } from "../types/common";
import { MinaSigner } from "../types/signer";
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

async function signTransactionWithDevice(
  account: Account,
  transaction: Transaction,
  deviceId: DeviceId,
  signerContext: SignerContext<MinaSigner>,
): Promise<{ operation: MinaOperation; signedSerializedTx: string }> {
  if (!transaction.fees) {
    throw new FeeNotLoaded();
  }

  const unsigned = await buildTransaction(account, transaction);
  const signTransactionCallback = (signer: MinaSigner) => signer.signTransaction(unsigned);
  const { signature, returnCode, message } = await signerContext(deviceId, signTransactionCallback);

  if (!signature && returnCode === MINA_CANCEL_RETURN_CODE) {
    throw new UserRefusedOnDevice();
  }

  invariant(signature, `returnCode: ${returnCode}, message: ${message}`);
  const encodedSignature = reEncodeRawSignature(signature);

  const signedTransaction: MinaSignedTransaction = {
    transaction: unsigned,
    signature: encodedSignature,
  };

  const operation = buildOptimisticOperation(
    account,
    transaction,
    transaction.fees.fee ?? new BigNumber(0),
  );
  const signedSerializedTx = JSON.stringify(signedTransaction);

  return { operation, signedSerializedTx };
}

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
      const executeSignature = async () => {
        o.next({ type: "device-signature-requested" });

        const { operation, signedSerializedTx } = await signTransactionWithDevice(
          account,
          transaction,
          deviceId,
          signerContext,
        );

        o.next({ type: "device-signature-granted" });

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: signedSerializedTx,
          },
        });
      };

      executeSignature().then(
        () => o.complete(),
        e => o.error(e),
      );
    });

export default buildSignOperation;
