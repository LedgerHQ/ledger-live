import type { Transaction } from "../types";
import { Observable } from "rxjs";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import buildTransaction from "./buildTransaction";
import BigNumber from "bignumber.js";
import type { Account, AccountBridge, Operation, OperationType } from "@ledgerhq/types-live";
import { AptosAPI } from "../api";
import LedgerAccount from "../LedgerAccount";

import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { AptosSigner } from "../types";

export const getAddress = (
  a: Account,
): {
  address: string;
  derivationPath: string;
} => ({ address: a.freshAddress, derivationPath: a.freshAddressPath });

export default buildSignOperation =
  (
    signerContext: SignerContext<AptosSigner>,
  ): AccountBridge<Transaction, Account>["signOperation"] =>
  ({ account, transaction, deviceId }) =>
    new Observable(o => {
      async function main() {
        o.next({ type: "device-signature-requested" });

        // const aptosClient = new AptosAPI(account.currency.id);

        // const ledgerAccount = new LedgerAccount(account.freshAddressPath, account.xpub);
        // await ledgerAccount.init(signerContext, deviceId);

        // const rawTx = await buildTransaction(account, transaction, aptosClient);
        // const txBytes = await ledgerAccount.signTransaction(rawTx);
        // const signed = Buffer.from(txBytes).toString("hex");
        const { derivationPath } = getAddress(account);

        const { r } = await signerContext(deviceId, async signer => {
          const r = await signer.sign(derivationPath, txPayload);
          return { r };
        });

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
            signature: signed,
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
