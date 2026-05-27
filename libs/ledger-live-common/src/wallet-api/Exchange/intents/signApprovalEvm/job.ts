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
import type { DeviceConnectionResult, Job } from "@ledgerhq/device-intent";
import { getCryptoCurrencyById } from "../../../../currencies";
import { DmkSignerEth } from "@ledgerhq/live-signer-evm";
import type { QuoteApprovalTransaction } from "../../quotes/types";
import type { SignApprovalEvmIntentInput, SignApprovalEvmJobState } from "./types";

/**
 * RLP-encode the approval payload from a swap quote into the unsigned legacy
 * EVM transaction hex expected by `SignerEth.signTransaction`. Quotes always
 * carry an explicit `gasPrice` + `gasLimit`, so we feed them straight into
 * `craftTransaction` as `customFees` and let coin-evm own the encoding
 * (no direct ethers import here).
 */
async function buildUnsignedApprovalTxHex(
  currency: CryptoCurrency,
  approvalTransaction: QuoteApprovalTransaction,
): Promise<string> {
  const calldataHex = approvalTransaction.calldata.replace(/^0x/, "");
  const data = calldataHex.length > 0 ? Buffer.from(calldataHex, "hex") : Buffer.alloc(0);

  const { transaction } = await craftTransaction(currency, {
    // The intent shape comes from `@ledgerhq/coin-module-framework`; we cast
    // rather than introduce a new direct dep on the framework type.
    transactionIntent: {
      intentType: "transaction",
      type: "send-legacy",
      sender: approvalTransaction.from,
      recipient: approvalTransaction.to,
      amount: BigInt(approvalTransaction.value || "0"),
      asset: { type: "native" },
      data: { type: "buffer", value: data },
    } as Parameters<typeof craftTransaction>[1]["transactionIntent"],
    customFees: {
      value: 0n,
      parameters: {
        gasLimit: BigInt(approvalTransaction.gasLimit || "100000"),
        gasPrice: BigInt(approvalTransaction.gasPrice),
      },
    },
  });

  return transaction;
}

function combineSignedTx(unsignedTxHex: string, signature: Signature): string {
  // `combine` accepts any `SignatureLike`; the DMK `{ r, s, v }` shape is one.
  return combine(unsignedTxHex, signature);
}

function runSignApproval(
  connectionResult: DeviceConnectionResult,
  input: SignApprovalEvmIntentInput,
): Observable<SignApprovalEvmJobState> {
  const currency = getCryptoCurrencyById(input.currencyId);
  return from(buildUnsignedApprovalTxHex(currency, input.approvalTransaction)).pipe(
    switchMap(unsignedTxHex => {
      const buffer = hexaStringToBuffer(unsignedTxHex);
      if (!buffer) {
        throw new Error("Failed to encode unsigned approval transaction to bytes");
      }
      const { dmk, sessionId } = connectionResult;
      // Reuse the production CAL-wired SignerEth so the device can
      // resolve ERC-20 / spender descriptors and clear-sign the
      // approval instead of falling back to blind signing.
      const signer = new DmkSignerEth(dmk, sessionId).signer;
      const { observable, cancel } = signer.signTransaction(input.derivationPath, buffer, {
        skipOpenApp: true,
      });

      return observable.pipe(
        finalize(cancel),
        map((state): SignApprovalEvmJobState | null => {
          if (state.status === DeviceActionStatus.Error) {
            const tag = (state.error as { _tag?: string })._tag;
            return {
              type: "failed",
              error: tag ? new Error(tag) : new Error("Sign approval failed"),
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
        filter((s): s is SignApprovalEvmJobState => s !== null),
      );
    }),
    catchError(err =>
      of<SignApprovalEvmJobState>({
        type: "failed",
        error: err instanceof Error ? err : new Error(String(err)),
      }),
    ),
  );
}

/**
 * Job for the approval signing intent.
 *
 * Emits an initial `preparing` state synchronously so the executor never
 * renders the intent component with `jobState: undefined`. All errors are
 * surfaced as a terminal `failed` value rather than an observable error, so
 * the orchestrator can read them via `onIntentJobStateChanged` before
 * reacting in `onIntentJobComplete`.
 */
export const signApprovalEvmJob: Job<SignApprovalEvmJobState, SignApprovalEvmIntentInput> = ({
  deviceConnectionResult,
  input,
}) =>
  concat(
    of<SignApprovalEvmJobState>({ type: "preparing" }),
    defer(() => runSignApproval(deviceConnectionResult, input)),
  );
