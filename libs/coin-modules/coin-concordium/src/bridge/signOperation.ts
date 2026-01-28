import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import {
  AccountAddress,
  AccountTransactionType,
  CcdAmount,
} from "@ledgerhq/concordium-sdk-adapter";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { AccountBridge, Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Observable } from "rxjs";
import { combine, craftTransaction, estimateFees, getNextValidSequence } from "../common-logic";
import { encodeMemoToDataBlob } from "../common-logic/utils";
import { ConcordiumSigner, Transaction } from "../types";
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
          ? AccountTransactionType.TransferWithMemo
          : AccountTransactionType.Transfer;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = {
          amount: CcdAmount.fromMicroCcd(actualAmount.toString()),
          toAddress: AccountAddress.fromBase58(transaction.recipient),
        };

        // Add memo to payload if present (for energy calculation)
        if (transaction.memo) {
          payload.memo = encodeMemoToDataBlob(transaction.memo);
        }

        const estimation = await estimateFees("", account.currency, transactionType, payload);

        const signature = await signerContext(deviceId, async signer => {
          const { freshAddressPath: derivationPath } = account;
          const publicKey = await signer.getPublicKey(derivationPath, false);

          // Follow standard Ledger Live pattern: craft transaction, then sign
          // Note: estimation returns bigint, convert to BigNumber for transaction crafting
          // The .toString() conversion is intentional for BigNumber precision safety
          const { transaction: hwTransaction, serializedTransaction } = await craftTransaction(
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

          // hwTransaction is already in hw-app format, ready for device signing
          const transactionSignature = await signer.signTransfer(hwTransaction, derivationPath);

          // Combine serialized transaction from SDK with device signature
          return combine(serializedTransaction, transactionSignature);
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
