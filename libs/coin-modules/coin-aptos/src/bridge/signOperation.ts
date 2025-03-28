import type { AptosAccount, Transaction } from "../types";
import { Observable } from "rxjs";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import buildTransaction from "./buildTransaction";
import BigNumber from "bignumber.js";
import type { Account, AccountBridge, Operation, OperationType } from "@ledgerhq/types-live";
import { AptosAPI } from "../api";

import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { AptosSigner } from "../types";
import { signTransaction } from "../network";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/helpers";

export const getAddress = (a: Account) => ({
  address: a.freshAddress,
  derivationPath: a.freshAddressPath,
});

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
        const type: OperationType = "OUT";
        const fee = transaction.fees || new BigNumber(0);
        const extra = {};
        const senders: string[] = [];
        const recipients: string[] = [];

        if (transaction.mode === "send") {
          senders.push(account.freshAddress);
          recipients.push(transaction.recipient);
        }

        const subAccount =
          !!transaction.subAccountId && findSubAccountById(account, transaction.subAccountId);

        const value = transaction.useAllAmount
          ? subAccount
            ? subAccount.balance
            : account.balance.minus(fee)
          : subAccount
            ? transaction.amount
            : transaction.amount.plus(fee);

        // build optimistic operation
        const operation: Operation = {
          id: encodeOperationId(accountId, hash, type),
          hash,
          type,
          value,
          fee,
          extra,
          blockHash: null,
          blockHeight: null,
          senders,
          recipients,
          accountId,
          date: new Date(),
          transactionSequenceNumber: Number(rawTx.sequence_number),
          subOperations: subAccount
            ? [
                {
                  id: encodeOperationId(subAccount.id, "", "OUT"),
                  type: "OUT",
                  accountId: transaction.subAccountId,
                  senders: [account.freshAddress],
                  recipients: [transaction.recipient],
                  value,
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
