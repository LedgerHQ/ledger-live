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
import { ConcordiumSigner, Transaction } from "../types";

export const buildSignOperation =
  (signerContext: SignerContext<ConcordiumSigner>): AccountBridge<Transaction>["signOperation"] =>
  ({ account, deviceId, transaction }) =>
    new Observable(o => {
      async function main() {
        const { fee } = transaction;
        if (!fee) throw new FeeNotLoaded();

        o.next({
          type: "device-signature-requested",
        });

        const nextSequenceNumber = await getNextValidSequence(
          account.freshAddress,
          account.currency,
        );

        const payload = {
          amount: CcdAmount.fromMicroCcd(transaction.amount.toString()),
          toAddress: AccountAddress.fromBase58(transaction.recipient),
        };

        const estimation = await estimateFees(
          "",
          account.currency,
          AccountTransactionType.Transfer,
          payload,
        );

        const signature = await signerContext(deviceId, async signer => {
          const { freshAddressPath: derivationPath } = account;
          const { publicKey } = await signer.getAddress(derivationPath, false);

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
              amount: transaction.amount,
              fee: new BigNumber(estimation.cost.toString()),
              energy: estimation.energy,
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
          value: transaction.amount,
          fee: new BigNumber(estimation.cost.toString()),
          blockHash: null,
          blockHeight: null,
          senders: [account.freshAddress],
          recipients: [transaction.recipient],
          date: new Date(),
          transactionSequenceNumber: new BigNumber(nextSequenceNumber),
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
