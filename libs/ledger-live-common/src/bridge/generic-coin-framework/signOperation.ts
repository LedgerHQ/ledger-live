import { Observable } from "rxjs";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Account, DeviceId, SignOperationEvent, AccountBridge } from "@ledgerhq/types-live";
import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";
import { completeIntent } from "./accountLayer";
import {
  bigNumberToBigIntDeep,
  buildOptimisticOperation,
  nextSequenceWithPending,
  transactionToIntent,
} from "./utils";
import { FeeNotLoaded } from "@ledgerhq/ledger-wallet-framework/errors";
import type { AccountLayerDeviceEvents } from "@ledgerhq/ledger-wallet-framework/api/types";
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
        const deviceEvents: AccountLayerDeviceEvents | undefined = bridgeApi.accountLayer
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
          const { publicKey } = (await signer.getAddress(derivationPath, {
            ...bridgeApi.getDeviceSignOptions?.(transaction, account),
            derivationMode: account.derivationMode,
          })) as GetAddressResult;

          const transactionIntent = await completeIntent(
            bridgeApi,
            transactionToIntent(
              account,
              { ...transaction },
              bridgeApi.computeIntentType,
              intent => coinModuleApi.craftTransactionData(context, intent),
              bridgeApi.buildIntentData,
            ),
            account,
            transaction,
            coinModuleApi,
            context,
          );
          transactionIntent.senderPublicKey = publicKey;

          if (typeof transactionIntent.sequence !== "bigint" || transactionIntent.sequence < 0n) {
            // The network sequence source lags behind a just-broadcast tx, so combine it with
            // locally-tracked pending operations to avoid reusing a nonce on rapid consecutive sends.
            const networkSequence = await coinModuleApi.getNextSequence(
              context,
              transactionIntent.sender,
            );
            transactionIntent.sequence = nextSequenceWithPending(
              account.pendingOperations ?? [],
              networkSequence,
            );
          }

          /* Craft unsigned blob via coin-framework */
          const crafted: CraftedTransaction = await coinModuleApi.craftTransaction(
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
            ...bridgeApi.getDeviceSignOptions?.(transaction, account),
            ...deviceEvents,
            derivationMode: account.derivationMode,
          });
          return {
            crafted,
            unsigned,
            txnSig,
            publicKey,
            sequence: transactionIntent.sequence,
          };
        });

        /* If the user cancelled inside signerContext */
        if (!signedInfo) return;
        if (!deviceEvents) o.next({ type: "device-signature-granted" });

        /* Combine payload + signature for broadcast */
        const combined = await coinModuleApi.combine(
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
        const decorate = bridgeApi.accountLayer?.decorateOptimisticOperation;
        const operation = decorate
          ? decorate(optimistic, signedInfo.crafted, account, { ...transaction })
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
