import { Observable } from "rxjs";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Account, DeviceId, SignOperationEvent, AccountBridge } from "@ledgerhq/types-live";
import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";
import {
  bigNumberToBigIntDeep,
  buildOptimisticOperation,
  nextSequenceWithPending,
  transactionToIntent,
} from "./utils";
import { FeeNotLoaded } from "@ledgerhq/ledger-wallet-framework/errors";
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
            // A deliberate fee override — prepareTransaction sets this only when the user picks a custom
            // fee. `value` above is the auto-resolved display fee, which a coin module must NOT treat as an
            // override: TRON crafts its TRC20 `fee_limit` from an override, and pinning it to the net,
            // energy-covered display fee (0 when the account has energy) reverts OUT_OF_ENERGY (LIVE-36865).
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
        // amount is already finalized by prepareTransaction; sign it as-is
        const signedInfo = await signerContext(deviceId, async signer => {
          const derivationPath = account.freshAddressPath;
          const { publicKey } = (await signer.getAddress(derivationPath, {
            derivationMode: account.derivationMode,
          })) as GetAddressResult;

          const transactionIntent = transactionToIntent(
            account,
            { ...transaction },
            bridgeApi.computeIntentType,
            intent => coinModuleApi.craftTransactionData(context, intent),
            bridgeApi.buildIntentData,
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
          const { transaction: unsigned } = await coinModuleApi.craftTransaction(
            context,
            transactionIntent,
            { customFees },
          );

          /* Notify UI that the device is now showing the tx */
          o.next({ type: "device-signature-requested" });
          /* Sign on Ledger device */
          const txnSig = await signer.signTransaction(derivationPath, unsigned, {
            ...transaction.recipientDomain,
            ...bridgeApi.getDeviceSignOptions?.(transaction, account),
            derivationMode: account.derivationMode,
          });
          return {
            unsigned,
            txnSig,
            publicKey,
            sequence: transactionIntent.sequence,
          };
        });

        /* If the user cancelled inside signerContext */
        if (!signedInfo) return;
        o.next({ type: "device-signature-granted" });

        /* Combine payload + signature for broadcast */
        const combined = await coinModuleApi.combine(
          context,
          signedInfo.unsigned,
          [signedInfo.txnSig],
          {
            pubkey: signedInfo.publicKey,
          },
        );
        const operation = buildOptimisticOperation(
          account,
          transaction,
          signedInfo.sequence,
          bridgeApi.describeOptimisticOperation,
        );
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
