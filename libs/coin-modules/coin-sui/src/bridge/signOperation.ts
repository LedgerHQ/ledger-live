import { FeeNotLoaded } from "@ledgerhq/ledger-wallet-framework/errors";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AccountBridge } from "@ledgerhq/types-live";
import { LedgerSigner } from "@mysten/signers/ledger";
import type { ClientWithCoreApi } from "@mysten/sui/client";
import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import suiConfig from "../config";
import { withCoreApi } from "../network/sdk";
import type { SuiAccount, SuiSigner, Transaction } from "../types";
import { buildOptimisticOperation } from "./buildOptimisticOperation";
import { buildTransaction } from "./buildTransaction";
import { calculateAmount } from "./utils";

type BuiltTransaction = Awaited<ReturnType<typeof buildTransaction>>;

/**
 * Signs on device against the flag-selected transport, which `LedgerSigner` needs a client for.
 *
 * Kept at module scope rather than inlined in the observable: nested inside the subscriber, `main`,
 * and the signer context, the client callback sat six functions deep.
 */
const signWithDevice = (
  account: SuiAccount,
  suiSigner: SuiSigner,
  { unsigned, objects, resolution }: BuiltTransaction,
) =>
  withCoreApi(
    suiConfig.getCoinConfig(account.currency.id),
    async (suiClient: ClientWithCoreApi) => {
      const ledgerSigner = await LedgerSigner.fromDerivationPath(
        account.freshAddressPath,
        suiSigner as unknown as Parameters<typeof LedgerSigner.fromDerivationPath>[1],
        suiClient,
      );
      return ledgerSigner.signTransaction(unsigned, objects, resolution);
    },
  );

/**
 * Sign Transaction with Ledger hardware
 */
export const buildSignOperation = (
  signerContext: SignerContext<SuiSigner>,
): AccountBridge<Transaction, SuiAccount>["signOperation"] => {
  return ({ account, deviceId, transaction, deviceModelId, certificateSignatureKind }) =>
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

        const built = await buildTransaction(
          account,
          transactionToSign,
          true,
          deviceModelId,
          certificateSignatureKind,
        );

        const signed = await signerContext(deviceId, suiSigner =>
          signWithDevice(account, suiSigner, built),
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
              unsigned: built.unsigned,
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
