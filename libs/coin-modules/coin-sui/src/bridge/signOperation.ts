import { FeeNotLoaded } from "@ledgerhq/ledger-wallet-framework/errors";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { AccountBridge } from "@ledgerhq/types-live";
import { LedgerSigner } from "@mysten/signers/ledger";
import type { ClientWithCoreApi } from "@mysten/sui/client";
import { Transaction as SuiTransaction } from "@mysten/sui/transactions";
import { BigNumber } from "bignumber.js";
import { Observable } from "rxjs";
import suiConfig from "../config";
import { SuiAddressBalanceAppUpdateRequired } from "../errors";
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

/** Device status word for a transaction the Sui app rejects as unrecognized/unsupported. */
const SUI_APP_UNKNOWN_ERROR = 0x0008;

/**
 * True when the built transaction spends from the SIP-58 address balance via a `FundsWithdrawal`
 * input (`0x2::coin::redeem_funds`). Sui apps that predate that parser reject such transfers with
 * an opaque UNKNOWN_ERROR (0x8), which we translate into an actionable error.
 */
function drawsFromAddressBalance(unsigned: Uint8Array): boolean {
  try {
    return SuiTransaction.from(unsigned)
      .getData()
      .inputs.some(input => input.$kind === "FundsWithdrawal");
  } catch {
    // If the bytes can't be parsed we can't confirm an address-balance spend, so treat it as
    // not one and let the original device error propagate rather than masking it with a parse error.
    return false;
  }
}

/** The Sui app returned SW 0x0008 (surfaced by the transport as UNKNOWN_ERROR (0x8)). */
function isSuiAppUnknownError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "TransportStatusError" &&
    (error as { statusCode?: number }).statusCode === SUI_APP_UNKNOWN_ERROR
  );
}

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
        ).catch(error => {
          // An address-balance transfer that the Sui app can't parse surfaces as UNKNOWN_ERROR
          // (0x8). Replace it with an actionable error telling the user to update the Sui app.
          if (isSuiAppUnknownError(error) && drawsFromAddressBalance(built.unsigned)) {
            throw new SuiAddressBalanceAppUpdateRequired();
          }
          throw error;
        });

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
