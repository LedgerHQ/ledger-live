import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { FeeNotLoaded } from "@ledgerhq/errors";
import type { AccountBridge } from "@ledgerhq/types-live";
import { LedgerSigner } from "@mysten/signers/ledger";
import type { SuiClient } from "@mysten/sui/client";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { buildTransaction } from "./buildTransaction";
import { calculateAmount } from "./utils";
import type { SuiAccount, SuiSigner, Transaction } from "../types";
import { withApi } from "../network/sdk";

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation = (
  signerContext: SignerContext<SuiSigner>,
): AccountBridge<Transaction, SuiAccount>["signOperation"] => {
  return ({ account, deviceId, transaction }) =>
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

        const signed = await signerContext(deviceId, async suiSigner =>
          withApi(async (suiClient: SuiClient) => {
            const ledgerSigner = await LedgerSigner.fromDerivationPath(
              account.freshAddressPath,
              suiSigner,
              suiClient,
            );
            return ledgerSigner.signTransaction(unsigned);
          }),
        );

        subscriber.next({
          type: "device-signature-granted",
        });

        const operation = buildOptimisticOperation(
          account,
          transactionToSign,
          transactionToSign.fees ?? BigNumber(0),
        );

        subscriber.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: signed.signature,
            rawData: {
              unsigned,
            },
          },
        });
      }

      main().then(
        () => subscriber.complete(),
        e => subscriber.error(e),
      );
    });
};
export default buildSignOperation;
