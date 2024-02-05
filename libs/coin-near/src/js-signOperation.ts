import * as nearAPI from "near-api-js";
import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { Transaction } from "./types";
import type {
  Operation,
  Account,
  SignOperationFnSignature,
  DeviceId,
  SignOperationEvent,
  OperationType,
} from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { buildTransaction } from "./js-buildTransaction";
import { NearAddress, NearSignature, NearSigner } from "./signer";
import { SignerContext } from "@ledgerhq/coin-framework/signer";

const buildOptimisticOperation = (
  account: Account,
  transaction: Transaction,
  fee: BigNumber,
): Operation => {
  let type: OperationType;
  let value = new BigNumber(transaction.amount);

  switch (transaction.mode) {
    case "stake":
      type = "STAKE";
      break;
    case "unstake":
      type = "UNSTAKE";
      break;
    case "withdraw":
      type = "WITHDRAW_UNSTAKED";
      break;
    default:
      value = value.plus(fee);
      type = "OUT";
  }

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
    date: new Date(),
    extra: {},
  };

  return operation;
};

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (
    signerContext: SignerContext<NearSigner, NearAddress | NearSignature>,
  ): SignOperationFnSignature<Transaction> =>
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

        const { publicKey } = (await signerContext(deviceId, signer =>
          signer.getAddress(account.freshAddressPath),
        )) as NearAddress;
        const unsigned = await buildTransaction(account, transaction, publicKey);

        const response = (await signerContext(deviceId, signer =>
          signer.signTransaction(unsigned.encode(), account.freshAddressPath),
        )) as NearSignature;

        const signedTransaction = new nearAPI.transactions.SignedTransaction({
          transaction: unsigned,
          signature: new nearAPI.transactions.Signature({
            keyType: unsigned.publicKey.keyType,
            data: response,
          }),
        });

        o.next({ type: "device-signature-granted" });

        const operation = buildOptimisticOperation(
          account,
          transaction,
          transaction.fees ?? new BigNumber(0),
        );
        const signedSerializedTx = signedTransaction.encode();

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: Buffer.from(signedSerializedTx).toString("base64"),
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });

export default buildSignOperation;
