import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { AccountBridge } from "@ledgerhq/types-live";
import { messageWithIntent, toSerializedSignature } from "@mysten/sui/cryptography";
import { Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";
import { verifyTransactionSignature } from "@mysten/sui/verify";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { buildTransaction } from "./buildTransaction";
import { calculateAmount } from "./utils";
import type { SuiAccount, SuiSigner, Transaction } from "../types";
import { ensureAddressFormat } from "../utils";

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (
    signerContext: SignerContext<SuiSigner>,
  ): AccountBridge<Transaction, SuiAccount>["signOperation"] =>
  ({ account, deviceId, transaction }) =>
    new Observable(subscriber => {
      async function main() {
        subscriber.next({
          type: "device-signature-requested",
        });

        if (!transaction.fees) {
          throw new FeeNotLoaded();
        }

        // Ensure amount is filled when useAllAmount
        const transactionToSign = {
          ...transaction,
          amount: calculateAmount({
            account,
            transaction,
          }),
        };

        const { unsigned } = await buildTransaction(account, transactionToSign);

        const signData = messageWithIntent("TransactionData", unsigned);

        const { signature } = await signerContext(deviceId, signer =>
          signer.signTransaction(account.freshAddressPath, signData),
        );

        const publicKeyResult = await signerContext(deviceId, signer =>
          signer.getPublicKey(account.freshAddressPath),
        );
        const publicKey = new Ed25519PublicKey(publicKeyResult.publicKey);

        const serializedSignature = toSerializedSignature({
          signature,
          signatureScheme: "ED25519",
          publicKey,
        });

        if (!transaction.skipVerify) {
          const verify = await verifyTransactionSignature(unsigned, serializedSignature, {
            address: ensureAddressFormat(account.freshAddress),
          });
          if (!verify) {
            throw new Error("verifyTransactionSignature failed");
          }
        }

        subscriber.next({
          type: "device-signature-granted",
        });

        const operation = buildOptimisticOperation(
          account,
          transactionToSign,
          transactionToSign.fees ?? new BigNumber(0),
        );

        subscriber.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: Buffer.from(signature).toString("base64"),
            rawData: {
              serializedSignature,
              unsigned: Buffer.from(unsigned).toString("base64"),
            },
          },
        });
      }

      main().then(
        () => subscriber.complete(),
        e => subscriber.error(e),
      );
    });

export default buildSignOperation;
