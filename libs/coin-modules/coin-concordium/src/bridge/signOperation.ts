import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { AccountBridge, Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import { encodeMemoToCbor } from "@ledgerhq/hw-app-concordium/lib/cbor";
import { TransactionType } from "@ledgerhq/hw-app-concordium/lib/types";
import { ConcordiumSigner, Transaction } from "../types";
import { combine, craftTransaction, estimateFees, getNextValidSequence } from "../logic";
import { getTransactionStatus } from "./getTransactionStatus";

export const buildSignOperation =
  (signerContext: SignerContext<ConcordiumSigner>): AccountBridge<Transaction>["signOperation"] =>
  ({ account, deviceId, transaction }) =>
    new Observable(o => {
      async function main() {
        const { fee } = transaction;
        if (!fee) throw new FeeNotLoaded();

        const status = await getTransactionStatus(account, transaction);
        const actualAmount = status.amount;

        o.next({
          type: "device-signature-requested",
        });

        const nextSequenceNumber = await getNextValidSequence(
          account.freshAddress,
          account.currency,
        );

        const lastOpSeqNumber =
          account.pendingOperations[0]?.transactionSequenceNumber ??
          account.operations[0]?.transactionSequenceNumber ??
          new BigNumber(0);

        const transactionType = transaction.memo
          ? TransactionType.TransferWithMemo
          : TransactionType.Transfer;

        const memoSize = transaction.memo ? encodeMemoToCbor(transaction.memo).length : undefined;

        const estimation = await estimateFees(account.currency, transactionType, memoSize);

        const signature = await signerContext(deviceId, async signer => {
          const { freshAddressPath: derivationPath } = account;
          const publicKey = await signer.getPublicKey(derivationPath, false);

          const structuredTransaction = await craftTransaction(
            {
              address: account.freshAddress,
              publicKey,
              nextSequenceNumber,
            },
            {
              recipient: transaction.recipient,
              amount: actualAmount,
              fee: new BigNumber(estimation.cost.toString()),
              energy: estimation.energy,
              ...(transaction.memo ? { memo: transaction.memo } : {}),
            },
          );

          const result = await signer.signTransaction(structuredTransaction, derivationPath);

          return combine(result.serialized, result.signature);
        });

        o.next({
          type: "device-signature-granted",
        });

        const hash = "";
        const operation: Operation = {
          id: encodeOperationId(account.id, hash, "OUT"),
          hash,
          accountId: account.id,
          type: "OUT",
          value: actualAmount,
          fee: new BigNumber(estimation.cost.toString()),
          blockHash: null,
          blockHeight: null,
          senders: [account.freshAddress],
          recipients: [transaction.recipient],
          date: new Date(),
          transactionSequenceNumber: lastOpSeqNumber.plus(1),
          extra: {},
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
