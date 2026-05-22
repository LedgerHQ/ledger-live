import { concat, defer, from, of, type Observable } from "rxjs";
import { catchError, filter, finalize, map, switchMap } from "rxjs/operators";
import { Transaction as EthersTransaction, Signature as EthersSignature } from "ethers";
import {
  DeviceActionStatus,
  hexaStringToBuffer,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import {
  SignerEthBuilder,
  SignTransactionDAStep,
  type Signature,
} from "@ledgerhq/device-signer-kit-ethereum";
import { combine } from "@ledgerhq/coin-evm/logic/combine";
import { getNodeApi } from "@ledgerhq/coin-evm/network/node/index";
import { TransactionTypes } from "@ledgerhq/coin-evm/types/index";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { DeviceConnectionResult, Job } from "@ledgerhq/device-intent";
import type { QuoteApprovalTransaction } from "@ledgerhq/live-common/wallet-api/Exchange/quotes/types";
import type { SignApprovalEvmIntentInput, SignApprovalEvmJobState } from "./types";

/**
 * RLP-encode the approval payload from a swap quote into the unsigned legacy
 * EVM transaction hex expected by `SignerEth.signTransaction`. Quotes always
 * carry `gasPrice`, so we encode the tx as legacy (type 0); EIP-1559
 * adaptation is intentionally out of scope for this POC.
 */
async function buildUnsignedApprovalTxHex(
  currencyId: string,
  approvalTransaction: QuoteApprovalTransaction,
): Promise<string> {
  const currency = getCryptoCurrencyById(currencyId);
  const chainId = currency.ethereumLikeInfo?.chainId;
  if (!chainId) {
    throw new Error(`Currency ${currencyId} has no chainId; not an EVM chain`);
  }

  const nodeApi = getNodeApi(currency);
  const nonce = await nodeApi.getTransactionCount(currency, approvalTransaction.from);

  return EthersTransaction.from({
    type: TransactionTypes.legacy,
    to: approvalTransaction.to,
    nonce,
    gasLimit: BigInt(approvalTransaction.gasLimit || "100000"),
    gasPrice: BigInt(approvalTransaction.gasPrice),
    data: approvalTransaction.calldata,
    value: BigInt(approvalTransaction.value),
    chainId,
  }).unsignedSerialized;
}

function combineSignedTx(unsignedTxHex: string, signature: Signature): string {
  return combine(
    unsignedTxHex,
    EthersSignature.from({ r: signature.r, s: signature.s, v: signature.v }),
  );
}

function runSignApproval(
  connectionResult: DeviceConnectionResult,
  input: SignApprovalEvmIntentInput,
): Observable<SignApprovalEvmJobState> {
  return from(buildUnsignedApprovalTxHex(input.currencyId, input.approvalTransaction)).pipe(
    switchMap(unsignedTxHex => {
      const buffer = hexaStringToBuffer(unsignedTxHex);
      if (!buffer) {
        throw new Error("Failed to encode unsigned approval transaction to bytes");
      }
      const { dmk, sessionId } = connectionResult;
      const signer = new SignerEthBuilder({ dmk, sessionId }).build();
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
