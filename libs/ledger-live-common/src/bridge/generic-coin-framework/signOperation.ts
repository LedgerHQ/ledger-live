import { Observable } from "rxjs";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Account, DeviceId, SignOperationEvent, AccountBridge } from "@ledgerhq/types-live";
import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";
import { decorateWithAccountModule } from "./accountModule";
import { writeIntentApi } from "./portfolio/intentApi";
import {
  bigNumberToBigIntDeep,
  buildOptimisticOperation,
  nextSequenceWithPending,
  transactionToIntent,
} from "./utils";
import { FeeNotLoaded } from "@ledgerhq/ledger-wallet-framework/errors";
import type { SignerDeviceEvents } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CraftedAccountTransaction } from "@ledgerhq/account-module-framework";
import type { CraftedTransaction } from "@ledgerhq/coin-module-framework/api/types";
import { type GetAddressResult } from "@ledgerhq/ledger-wallet-framework/derivation";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { GenericTransaction } from "./types";

/**
 * Sign Transaction with Ledger hardware
 */
export const genericSignOperation =
  (network: string, kind: string) =>
  (signerContext: SignerContext<any>): AccountBridge<GenericTransaction>["signOperation"] =>
  ({
    account,
    transaction,
    deviceId,
  }: {
    account: Account;
    transaction: GenericTransaction;
    deviceId: DeviceId;
  }): Observable<SignOperationEvent> =>
    new Observable(o => {
      async function main() {
        const coinModuleApi = await getCoinModuleApi(account.currency.id, kind);
        const context = buildContext(account.currency.id);
        const bridgeApi = await getBridgeApi(account.currency, network);
        if (!transaction.fees) throw new FeeNotLoaded();
        const intentApi = writeIntentApi(bridgeApi, coinModuleApi, account, { ...transaction });
        const customFees = bigNumberToBigIntDeep({
          value: transaction.fees ?? new BigNumber(0),
          parameters: {
            // The last estimation's telemetry, for a family that opted in — see
            // `BridgeApi.forwardsFeeParametersToCraft` for why it is not always-on.
            //
            // Spread first, and every field below is written unconditionally, so the framework's own
            // value wins any collision — including when it is `undefined`, which
            // `bigNumberToBigIntDeep` then drops, leaving the key absent.
            ...(bridgeApi.forwardsFeeParametersToCraft ? transaction.feeParameters : undefined),
            // A deliberate fee override; `prepareTransaction` sets it only when the user picks a
            // custom fee, and clears `feeParameters` on that path unless send-max forces an
            // estimate too — so a module resolving a ceiling must prefer this over the spread.
            fees: transaction.customFees?.parameters?.fees,
            feesStrategy: transaction.feesStrategy ?? undefined,
            sponsored: transaction.sponsored,
            gasLimit: transaction.customGasLimit ?? transaction.gasLimit,
            gasPrice: transaction.gasPrice,
            maxFeePerGas: transaction.maxFeePerGas,
            maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
            additionalFees: transaction.additionalFees,
          },
        });
        // A family signer that drives several device steps reports them itself, in the order the
        // device goes through them (bitcoin streams the previous transactions before asking for
        // the signature), so the framework does not emit its own requested/granted events for it.
        const binding = bridgeApi.accountModule;
        const deviceEvents: SignerDeviceEvents | undefined = binding
          ? {
              onDeviceStreaming: ({ progress, index, total }) =>
                o.next({ type: "device-streaming", progress, index, total }),
              onDeviceSignatureRequested: () => o.next({ type: "device-signature-requested" }),
              onDeviceSignatureGranted: () => o.next({ type: "device-signature-granted" }),
            }
          : undefined;

        // amount is already finalized by prepareTransaction; sign it as-is
        const signedInfo = await signerContext(deviceId, async signer => {
          const derivationPath = account.freshAddressPath;
          // Resolved once: `applyDeviceSignResult` is handed this very object after signing.
          const deviceSignOptions = bridgeApi.getDeviceSignOptions?.(transaction, account);
          const { publicKey } = (await signer.getAddress(derivationPath, {
            ...deviceSignOptions,
            derivationMode: account.derivationMode,
          })) as GetAddressResult;

          const transactionIntent = transactionToIntent(
            account,
            { ...transaction },
            bridgeApi.computeIntentType,
            intent => intentApi.craftTransactionData(context, intent),
            bridgeApi.buildIntentData,
          );
          transactionIntent.senderPublicKey = publicKey;

          // An account module sequences its own transactions (a UTXO account has no nonce).
          if (
            !binding &&
            (typeof transactionIntent.sequence !== "bigint" || transactionIntent.sequence < 0n)
          ) {
            // The network sequence source lags behind a just-broadcast tx, so combine it with
            // locally-tracked pending operations to avoid reusing a nonce on rapid consecutive sends.
            // On the portfolio layer, the side writing for the chain tells the network sequence.
            const networkSequence = await intentApi.getNextSequence(
              context,
              transactionIntent.sender,
            );
            transactionIntent.sequence = nextSequenceWithPending(
              account.pendingOperations ?? [],
              networkSequence,
            );
          }

          /* Craft unsigned blob via coin-framework */
          const crafted: CraftedTransaction = await intentApi.craftTransaction(
            context,
            transactionIntent,
            { customFees },
          );
          const unsigned = crafted.transaction;

          /* Notify UI that the device is now showing the tx */
          if (!deviceEvents) o.next({ type: "device-signature-requested" });
          /* Sign on Ledger device */
          const txnSig = await signer.signTransaction(derivationPath, unsigned, {
            ...transaction.recipientDomain,
            ...deviceSignOptions,
            ...deviceEvents,
            derivationMode: account.derivationMode,
          });
          return {
            crafted,
            // What the device signed can differ from what was crafted (see `applyDeviceSignResult`).
            unsigned: bridgeApi.applyDeviceSignResult?.(unsigned, deviceSignOptions) ?? unsigned,
            txnSig,
            publicKey,
            sequence: transactionIntent.sequence,
          };
        });

        /* If the user cancelled inside signerContext */
        if (!signedInfo) return;
        if (!deviceEvents) o.next({ type: "device-signature-granted" });

        /* Combine payload + signature for broadcast */
        const combined = await intentApi.combine(
          context,
          signedInfo.unsigned,
          [signedInfo.txnSig],
          {
            pubkey: signedInfo.publicKey,
          },
        );
        const optimistic = buildOptimisticOperation(
          account,
          transaction,
          signedInfo.sequence,
          bridgeApi.describeOptimisticOperation,
        );
        // What the account module crafted; the portfolio-service answers no operation.
        const operation =
          binding && "operation" in signedInfo.crafted
            ? decorateWithAccountModule(
                binding,
                optimistic,
                signedInfo.crafted as CraftedAccountTransaction,
                account,
                { ...transaction },
              )
            : optimistic;
        if (!operation.id) {
          log("Generic coin-framework", "buildOptimisticOperation", operation);
        }
        // NOTE: we set the transactionSequenceNumber before on the operation
        // now that we create it in craftTransaction, we might need to return it back from craftTransaction also
        o.next({
          type: "signed",
          signedOperation: {
            operation,
            signature: combined,
          },
        });
      }

      main().then(
        () => o.complete(),
        e => o.error(e),
      );
    });
