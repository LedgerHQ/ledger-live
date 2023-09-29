import type { Transaction } from "./types";
import { Observable } from "rxjs";
import { withDevice } from "../../hw/deviceAccess";
import { encodeOperationId } from "../../operation";
import buildTransaction from "./js-buildTransaction";
import BigNumber from "bignumber.js";

import type { Account, Operation, OperationType, SignOperationEvent } from "@ledgerhq/types-live";
import { AptosAPI } from "./api";
import LedgerAccount from "./LedgerAccount";

const signOperation = ({
  account,
  deviceId,
  transaction,
}: {
  account: Account;
  deviceId: any;
  transaction: Transaction;
}): Observable<SignOperationEvent> =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        let cancelled;

        async function main() {
          const aptosClient = new AptosAPI(account.currency.id);

          o.next({ type: "device-signature-requested" });

          const ledgerAccount = new LedgerAccount(account.freshAddresses[0].derivationPath);
          await ledgerAccount.init(transport);

          const rawTx = await buildTransaction(account, transaction, aptosClient);
          const signedTx = await ledgerAccount.signTransaction(rawTx);

          if (cancelled) return;

          o.next({ type: "device-signature-granted" });

          const hash = "";
          const accountId = account.id;
          const fee = transaction.fees || new BigNumber(0);
          const extra = {};
          const type: OperationType = "OUT";
          const senders: string[] = [];
          const recipients: string[] = [];

          if (transaction.mode === "send") {
            senders.push(account.freshAddress);
            recipients.push(transaction.recipient);
          }

          // build optimistic operation
          const operation: Operation = {
            id: encodeOperationId(accountId, hash, type),
            hash,
            type,
            value: transaction.useAllAmount
              ? account.balance.minus(fee)
              : transaction.amount.plus(fee),
            fee,
            extra,
            blockHash: null,
            blockHeight: null,
            senders,
            recipients,
            accountId,
            date: new Date(),
            transactionSequenceNumber: Number(rawTx.sequence_number),
          };

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature: Buffer.from(signedTx).toString("hex"),
              expirationDate: undefined,
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
      }),
  );

export default signOperation;
