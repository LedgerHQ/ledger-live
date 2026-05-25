import { concat, defer, of, type Observable } from "rxjs";
import { catchError, filter, finalize, map } from "rxjs/operators";
import {
  DeviceActionStatus,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import {
  SignerEthBuilder,
  SignTypedDataDAStateStep,
  type Signature,
} from "@ledgerhq/device-signer-kit-ethereum";
import type { DeviceConnectionResult, Job } from "@ledgerhq/device-intent";
import type {
  SignPermit2EvmIntentInput,
  SignPermit2EvmJobState,
} from "./types";

/**
 * Serialise a DMK `Signature` ({ r, s, v }) into the canonical 65-byte
 * EVM signature hex string (`0x` + r + s + v) that Permit2 spenders
 * expect. Mirrors what `walletAPI.message.sign` returns in the live-app
 * (`Buffer.toString("hex")` already concatenates the same r||s||v
 * bytes).
 */
function serializeSignature(signature: Signature): string {
  const r = signature.r.startsWith("0x") ? signature.r.slice(2) : signature.r;
  const s = signature.s.startsWith("0x") ? signature.s.slice(2) : signature.s;
  const v = signature.v.toString(16).padStart(2, "0");
  return `0x${r}${s}${v}`;
}

function runSignPermit2(
  connectionResult: DeviceConnectionResult,
  input: SignPermit2EvmIntentInput,
): Observable<SignPermit2EvmJobState> {
  const { dmk, sessionId } = connectionResult;
  const signer = new SignerEthBuilder({ dmk, sessionId }).build();
  const { observable, cancel } = signer.signTypedData(
    input.derivationPath,
    input.typedData,
    { skipOpenApp: true },
  );

  return observable.pipe(
    finalize(cancel),
    map((state): SignPermit2EvmJobState | null => {
      if (state.status === DeviceActionStatus.Error) {
        const tag = (state.error as { _tag?: string })._tag;
        return {
          type: "failed",
          error: tag ? new Error(tag) : new Error("Sign permit failed"),
        };
      }
      if (state.status === DeviceActionStatus.Completed) {
        return { type: "signed", signatureHex: serializeSignature(state.output) };
      }
      if (state.status === DeviceActionStatus.Pending) {
        const { step, requiredUserInteraction } = state.intermediateValue;
        if (
          step === SignTypedDataDAStateStep.GET_APP_CONFIG ||
          step === SignTypedDataDAStateStep.GET_ADDRESS ||
          step === SignTypedDataDAStateStep.BUILD_CONTEXT ||
          step === SignTypedDataDAStateStep.PROVIDE_CONTEXT ||
          step === SignTypedDataDAStateStep.PROVIDE_GENERIC_CONTEXT
        ) {
          return { type: "loading-context" };
        }
        if (requiredUserInteraction === UserInteractionRequired.SignTypedData) {
          return { type: "awaiting-confirmation" };
        }
        if (
          step === SignTypedDataDAStateStep.SIGN_TYPED_DATA ||
          step === SignTypedDataDAStateStep.SIGN_TYPED_DATA_LEGACY
        ) {
          return { type: "signing" };
        }
      }
      return null;
    }),
    filter((s): s is SignPermit2EvmJobState => s !== null),
    catchError(err =>
      of<SignPermit2EvmJobState>({
        type: "failed",
        error: err instanceof Error ? err : new Error(String(err)),
      }),
    ),
  );
}

/**
 * Job for the Permit2 EIP-712 signing intent.
 *
 * Mirrors {@link signApprovalEvmJob} so the orchestration can reuse the
 * same sign-result state machine: emits an initial `preparing` value
 * synchronously, surfaces device-driven progress as the DMK signer does,
 * and converts errors into a terminal `failed` state instead of an
 * observable error.
 */
export const signPermit2EvmJob: Job<
  SignPermit2EvmJobState,
  SignPermit2EvmIntentInput
> = ({ deviceConnectionResult, input }) =>
  concat(
    of<SignPermit2EvmJobState>({ type: "preparing" }),
    defer(() => runSignPermit2(deviceConnectionResult, input)),
  );
