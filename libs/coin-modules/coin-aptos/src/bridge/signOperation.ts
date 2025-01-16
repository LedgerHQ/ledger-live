import type { AptosAccount, Transaction } from "../types";
import { Observable } from "rxjs";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import buildTransaction from "./buildTransaction";
import BigNumber from "bignumber.js";
import type { Account, AccountBridge, Operation, OperationType } from "@ledgerhq/types-live";
import { AptosAPI } from "../api";

import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { AptosSigner } from "../types";

export const getAddress = (
  a: Account,
): {
  address: string;
  derivationPath: string;
} => ({ address: a.freshAddress, derivationPath: a.freshAddressPath });

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
        const txPayload = Buffer.from(rawTx.bcsToBytes());
        const { derivationPath } = getAddress(account);

        const { r } = await signerContext(deviceId, async signer => {
          const r = await signer.signTransaction(derivationPath, txPayload);
          return { r };
        });

        o.next({ type: "device-signature-granted" });

        // if (!r.signature_compact) {
        //   throw new Error("Signature compact is null");
        // }

        // build signature on the correct format
        const signature = r.signature.toString();

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

        // // build optimistic operation
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
