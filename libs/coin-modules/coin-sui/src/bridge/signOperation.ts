import { Observable } from "rxjs";
import { BigNumber } from "bignumber.js";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { AccountBridge } from "@ledgerhq/types-live";
import { verifyTransactionSignature } from "@mysten/sui/verify";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { messageWithIntent } from "@mysten/sui/cryptography";
import { toSerializedSignature } from "@mysten/sui/cryptography";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { SuiAccount, SuiSigner, Transaction } from "../types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { buildTransaction } from "./buildTransaction";
import { calculateAmount } from "./utils";
// import { signExtrinsic } from "../logic";
import { Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation =
  (
    signerContext: SignerContext<SuiSigner>,
  ): AccountBridge<Transaction, SuiAccount>["signOperation"] =>
  test =>
    new Observable(subscriber => {
      console.log("buildSignOperation test", test);
      const { account, deviceId, transaction } = test;
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
        const { executeTransactionBlock, unsigned } = await buildTransaction(
          account,
          transactionToSign,
          true,
        );

        console.log("buildSignOperation unsigned", unsigned);

        const signData = messageWithIntent("TransactionData", unsigned);

        console.log("buildSignOperation signData", signData);

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
        console.log(
          "buildSignOperation publicKey",
          publicKey.toSuiPublicKey(),
          publicKey.toBase64(),
        );
        console.log(
          "buildSignOperation serializedSignature",
          serializedSignature,
          "account.freshAddress",
          account.freshAddress,
        );

        const keypair = new Ed25519Keypair();

        console.log(
          "buildSignOperation keypair.signTransaction",
          (await keypair.signTransaction(unsigned)).signature,
        );

        const test = await verifyTransactionSignature(
          unsigned,
          (await keypair.signTransaction(unsigned)).signature,
          {
            // optionally verify that the signature is valid for a specific address
            address: keypair.getPublicKey().toSuiAddress(),
          },
        );

        console.log(
          "buildSignOperation test",
          test,
          test.toSuiAddress() !== (await keypair.toSuiAddress()),
          "test.toSuiAddress()",
          test.toSuiAddress(),
          "(await keypair.toSuiAddress())",
          await keypair.toSuiAddress(),
        );

        const verify = await verifyTransactionSignature(unsigned, serializedSignature, {
          address: "0x" + account.freshAddress,
        });
        console.log("buildSignOperation verify", verify);

        const result = executeTransactionBlock({
          transactionBlock: unsigned,
          signature: serializedSignature,
          options: {
            showEffects: true,
          },
        });

        console.log("executeTransactionBlock result", result);

        subscriber.next({
          type: "device-signature-granted",
        });

        console.log("buildOptimisticOperation transactionToSign", transactionToSign.fees);
        const operation = buildOptimisticOperation(
          account,
          transactionToSign,
          transactionToSign.fees ?? new BigNumber(0),
        );

        console.log("buildSignOperation operation", operation);

        subscriber.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: Buffer.from(signature).toString("base64"),
          },
        });
      }

      main().then(
        () => subscriber.complete(),
        e => subscriber.error(e),
      );
    });

export default buildSignOperation;
