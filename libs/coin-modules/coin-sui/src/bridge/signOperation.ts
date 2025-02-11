import { Observable } from "rxjs";
import { BigNumber } from "bignumber.js";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { AccountBridge } from "@ledgerhq/types-live";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { SuiAccount, SuiSigner, Transaction } from "../types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { buildTransaction } from "./buildTransaction";
import { calculateAmount } from "./utils";

// import { signExtrinsic } from "../logic";
// import suiAPI from "../network";

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

        console.log("buildSignOperation props", account, deviceId, transaction);

        // Ensure amount is filled when useAllAmount
        const transactionToSign = {
          ...transaction,
          amount: calculateAmount({
            account,
            transaction,
          }),
        };
        const { unsigned } = await buildTransaction(account, transactionToSign, true);

        console.log("buildSignOperation unsigned", unsigned);
        const { signature } = await signerContext(deviceId, signer =>
          signer.signTransaction(account.freshAddressPath, unsigned.serialize()),
        );

        // const signed = await signExtrinsic(unsigned, signature, registry);
        subscriber.next({
          type: "device-signature-granted",
        });
        const operation = buildOptimisticOperation(
          account,
          transactionToSign,
          transactionToSign.fees ?? new BigNumber(0),
        );

        console.log("buildSignOperation signature", signature, "operation", operation);

        subscriber.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: Buffer.from(signature).toString("hex"),
          },
        });
      }

      main().then(
        () => subscriber.complete(),
        e => subscriber.error(e),
      );
    });

export default buildSignOperation;
