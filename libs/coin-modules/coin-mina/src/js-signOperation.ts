import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { FeeNotLoaded } from "@ledgerhq/errors";
// import * as minaAPI from "mina-ledger-js";
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
import { MinaSigner } from "./signer";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
// import { buildTransaction } from "./js-buildTransaction";

const buildOptimisticOperation = (
  account: Account,
  transaction: Transaction,
  fee: BigNumber,
): Operation => {
  let value = new BigNumber(transaction.amount);

  value = value.plus(fee);
  const type: OperationType = "OUT";

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
  (_signerContext: SignerContext<MinaSigner>): SignOperationFnSignature<Transaction> =>
  ({
    account,
    transaction,
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

        // const { publicKey } = (await signerContext(deviceId, signer =>
        //   signer.getAddress(account.freshAddressPath),
        // )) as MinaAddress;
        // const unsigned = await buildTransaction(account, transaction, publicKey);

        // const response = (await signerContext(deviceId, signer =>
        //   signer.signTransaction(unsigned.encode(), account.freshAddressPath),
        // )) as MinaSignature;

        // const signedTransaction = new minaAPI.transactions.SignedTransaction({
        //   transaction: unsigned,
        //   signature: new minaAPI.transactions.Signature({
        //     keyType: unsigned.publicKey.keyType,
        //     data: response,
        //   }),
        // });

        o.next({ type: "device-signature-granted" });

        const operation = buildOptimisticOperation(
          account,
          transaction,
          transaction.fees ?? new BigNumber(0),
        );
        // const signedSerializedTx = signedTransaction.encode();

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            // signature: Buffer.from(signedSerializedTx).toString("base64"),
            signature: "",
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });

export default buildSignOperation;
