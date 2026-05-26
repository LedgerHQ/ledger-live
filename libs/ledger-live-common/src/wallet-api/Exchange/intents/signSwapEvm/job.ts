import { Buffer } from "buffer";
import { concat, defer, from, of, type Observable } from "rxjs";
import { catchError, filter, finalize, map, switchMap } from "rxjs/operators";
import {
  DeviceActionStatus,
  hexaStringToBuffer,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import {
  SignTransactionDAStep,
  type Signature,
} from "@ledgerhq/device-signer-kit-ethereum";
import { combine } from "@ledgerhq/coin-evm/logic/combine";
import { craftTransaction } from "@ledgerhq/coin-evm/logic/craftTransaction";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import type { DeviceConnectionResult, Job } from "@ledgerhq/device-intent";
import { getCryptoCurrencyById } from "../../../../currencies";
import { DmkSignerEth } from "@ledgerhq/live-signer-evm";
import type { DexTransactionData } from "../../dex";
import type { SignSwapEvmIntentInput, SignSwapEvmJobState } from "./types";

/**
 * RLP-encode the DEX-provided swap calldata into the unsigned EVM
 * transaction hex expected by `SignerEth.signTransaction`. DEX builders
 * only supply `to / data / value / gasLimit`; we feed those to
 * `craftTransaction` and let coin-evm pull EIP-1559 fee data from the node
 * (mirroring `walletAPI.transaction.signAndBroadcast` in the live-app).
 */
async function buildUnsignedSwapTxHex(
  currency: CryptoCurrency,
  account: Account,
  transactionData: DexTransactionData,
): Promise<string> {
  const calldataHex = transactionData.data.replace(/^0x/, "");
  const data = calldataHex.length > 0 ? Buffer.from(calldataHex, "hex") : Buffer.alloc(0);

  const { transaction } = await craftTransaction(currency, {
    transactionIntent: {
      intentType: "transaction",
      type: "send-eip1559",
      sender: account.freshAddress,
      recipient: transactionData.to,
      amount: BigInt(transactionData.value || "0"),
      asset: { type: "native" },
      data: { type: "buffer", value: data },
      feesStrategy: "medium",
    } as Parameters<typeof craftTransaction>[1]["transactionIntent"],
    customFees: {
      value: 0n,
      // Only gasLimit is pinned — `craftTransaction` fetches `maxFeePerGas`
      // and `maxPriorityFeePerGas` from the node when fee params are missing.
      parameters: { gasLimit: BigInt(transactionData.gasLimit) },
    },
  });

  return transaction;
}

function combineSignedTx(unsignedTxHex: string, signature: Signature): string {
  return combine(unsignedTxHex, signature);
}

function runSignSwap(
  connectionResult: DeviceConnectionResult,
  input: SignSwapEvmIntentInput,
): Observable<SignSwapEvmJobState> {
  const currency = getCryptoCurrencyById(input.currencyId);
  return from(buildUnsignedSwapTxHex(currency, input.account, input.transactionData)).pipe(
    switchMap(unsignedTxHex => {
      const buffer = hexaStringToBuffer(unsignedTxHex);
      if (!buffer) {
        throw new Error("Failed to encode unsigned swap transaction to bytes");
      }
      const { dmk, sessionId } = connectionResult;
      // Reuse the production CAL-wired SignerEth so the device can
      // resolve partner calldata descriptors (Uniswap UniversalRouter,
      // 1inch AggregationRouter, …) and clear-sign the swap instead
      // of falling back to blind signing.
      const signer = new DmkSignerEth(dmk, sessionId).signer;
      const { observable, cancel } = signer.signTransaction(input.derivationPath, buffer, {
        skipOpenApp: true,
      });

      return observable.pipe(
        finalize(cancel),
        map((state): SignSwapEvmJobState | null => {
          if (state.status === DeviceActionStatus.Error) {
            const tag = (state.error as { _tag?: string })._tag;
            return {
              type: "failed",
              error: tag ? new Error(tag) : new Error("Sign swap failed"),
            };
          }
          if (state.status === DeviceActionStatus.Completed) {
            return { type: "signed", signedTxHex: combineSignedTx(unsignedTxHex, state.output) };
          }
          if (state.status === DeviceActionStatus.Pending) {
            const { step, requiredUserInteraction } = state.intermediateValue;
            if (
              step === SignTransactionDAStep.BUILD_CONTEXTS ||
              step === SignTransactionDAStep.GET_APP_CONFIG ||
              step === SignTransactionDAStep.GET_ADDRESS ||
              step === SignTransactionDAStep.PARSE_TRANSACTION ||
              step === SignTransactionDAStep.PROVIDE_CONTEXTS
            ) {
              return { type: "loading-context" };
            }
            if (requiredUserInteraction === UserInteractionRequired.SignTransaction) {
              return { type: "awaiting-confirmation" };
            }
            if (
              step === SignTransactionDAStep.SIGN_TRANSACTION ||
              step === SignTransactionDAStep.BLIND_SIGN_TRANSACTION_FALLBACK
            ) {
              return { type: "signing" };
            }
          }
          return null;
        }),
        filter((s): s is SignSwapEvmJobState => s !== null),
      );
    }),
    catchError(err =>
      of<SignSwapEvmJobState>({
        type: "failed",
        error: err instanceof Error ? err : new Error(String(err)),
      }),
    ),
  );
}

/**
 * Job for the swap signing intent.
 *
 * Mirrors {@link signApprovalEvmJob} so the orchestration can reuse the
 * same state machine: emits an initial `preparing` value synchronously,
 * surfaces device-driven progress as the DMK signer does, and converts
 * errors into a terminal `failed` state instead of an observable error.
 */
export const signSwapEvmJob: Job<SignSwapEvmJobState, SignSwapEvmIntentInput> = ({
  deviceConnectionResult,
  input,
}) =>
  concat(
    of<SignSwapEvmJobState>({ type: "preparing" }),
    defer(() => runSignSwap(deviceConnectionResult, input)),
  );
