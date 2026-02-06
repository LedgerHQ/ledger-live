import { findSubAccountById } from "@ledgerhq/coin-framework/account/helpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { Account, AccountBridge, Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import buildTransaction from "../logic/buildTransaction";
import { AptosAPI } from "../network";
import { signTransaction } from "../network";
import type { AptosAccount, AptosOperation, Transaction } from "../types";

import { AptosSigner } from "../types";

export const getAddress = (a: Account) => ({
  address: a.freshAddress,
  derivationPath: a.freshAddressPath,
});

const getOperationType = (transaction: Transaction): OperationType => {
  switch (transaction.mode) {
    case "stake":
      return "STAKE";
    case "restake":
      return "STAKE";
    case "unstake":
      return "UNSTAKE";
    case "withdraw":
      return "WITHDRAW";
    default:
      return "OUT";
  }
};

const buildSignOperation =
  (
    signerContext: SignerContext<AptosSigner>,
  ): AccountBridge<Transaction, AptosAccount>["signOperation"] =>
  ({ account, transaction, deviceId }) =>
    new Observable(o => {
      async function main() {
        o.next({ type: "device-signature-requested" });

        const aptosClient = new AptosAPI(account.currency.id);

        const rawTx = await buildTransaction(account, transaction, aptosClient);
        const txBytes = await signTransaction(signerContext, account, deviceId, rawTx);
        const signature = Buffer.from(txBytes).toString("hex");

        o.next({ type: "device-signature-granted" });

        const accountId = account.id;
        const hash = "";
        const type: OperationType = getOperationType(transaction);
        const fee = transaction.fees || new BigNumber(0);
        const extra = {};
        const senders: string[] = [];
        const recipients: string[] = [];

        senders.push(account.freshAddress);
        recipients.push(transaction.recipient);

        const subAccount =
          !!transaction.subAccountId && findSubAccountById(account, transaction.subAccountId);

        // build optimistic operation
        const operation: AptosOperation = {
          id: encodeOperationId(accountId, hash, type),
          hash,
          type,
          value: subAccount ? fee : transaction.amount.plus(fee),
          fee,
          extra,
          blockHash: null,
          blockHeight: null,
          senders,
          recipients,
          accountId,
          date: new Date(),
          transactionSequenceNumber: new BigNumber(rawTx.sequence_number.toString()),
          subOperations: subAccount
            ? [
                {
                  id: encodeOperationId(subAccount.id, "", "OUT"),
                  type: "OUT",
                  accountId: transaction.subAccountId,
                  senders: [account.freshAddress],
                  recipients: [transaction.recipient],
                  value: transaction.amount,
                  fee,
                  date: new Date(),
                } as Operation,
              ]
            : [],
        };

        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature,
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });

export default buildSignOperation;
