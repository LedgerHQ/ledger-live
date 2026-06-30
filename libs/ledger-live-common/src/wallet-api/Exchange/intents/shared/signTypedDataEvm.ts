import { defer, of, type Observable } from "rxjs";
import { catchError, filter, finalize, map } from "rxjs/operators";
import { Signature as EthersSignature } from "ethers";
import {
  DeviceActionStatus,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import { SignTypedDataDAStateStep } from "@ledgerhq/device-signer-kit-ethereum";
import type { DeviceConnectionResult } from "@ledgerhq/device-intent";
import type { EIP712Message } from "@ledgerhq/types-live";
import { DmkSignerEth } from "@ledgerhq/live-signer-evm";
import { mapDmkSignerError } from "./mapDmkSignerError";

/**
 * Discriminated union of states emitted by the shared EIP-712 typed-data
 * signing helper {@link runSignTypedDataEvm}.
 *
 * Job-specific intents (Permit2, RFQ order) consume this shape directly
 * because their externally-surfaced `JobState` is structurally identical.
 */
export type SignTypedDataEvmRunState =
  | { type: "loading-context" }
  | { type: "awaiting-confirmation" }
  | { type: "signing" }
  | { type: "signed"; signatureHex: string }
  | { type: "failed"; error: Error };

/**
 * Run an EIP-712 typed-data signing flow through the production CAL-wired
 * DMK Ethereum signer.
 *
 * Centralises the DMK plumbing shared by the Permit2 and RFQ signing
 * intents so both surface the same intermediate states and convert
 * device errors into a terminal `failed` value rather than an observable
 * error. The caller wraps the returned observable with a `concat(of("preparing"))`
 * + intent-specific `failed` error message so each intent can keep its
 * own error copy.
 */
export function runSignTypedDataEvm(
  connectionResult: DeviceConnectionResult,
  typedData: EIP712Message,
  derivationPath: string,
  errorLabel: string,
): Observable<SignTypedDataEvmRunState> {
  return defer(() => {
    const { dmk, sessionId } = connectionResult;
    // Reuse the production CAL-wired SignerEth so EIP-712 typed-data
    // filters load on-device (Permit2 spender, token symbols, …)
    // instead of falling back to blind signing.
    const signer = new DmkSignerEth(dmk, sessionId).signer;
    const { observable, cancel } = signer.signTypedData(
      derivationPath,
      typedData,
      { skipOpenApp: true },
    );

    return observable.pipe(
      finalize(cancel),
      map((state): SignTypedDataEvmRunState | null => {
        if (state.status === DeviceActionStatus.Error) {
          return {
            type: "failed",
            error: mapDmkSignerError(state.error, errorLabel),
          };
        }
        if (state.status === DeviceActionStatus.Completed) {
          // ethers handles every `v` encoding DMK might emit (EIP-2098
          // y-parity 0/1, recovery id 27/28, EIP-155 chain-prefixed)
          // and emits the canonical 65-byte hex Permit2 / partner RFQ
          // submit endpoints expect. Matches the helper used in
          // `coin-evm/src/hw-signMessage.ts`.
          return {
            type: "signed",
            signatureHex: EthersSignature.from(state.output).serialized,
          };
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
      filter((s): s is SignTypedDataEvmRunState => s !== null),
      catchError(err =>
        of<SignTypedDataEvmRunState>({
          type: "failed",
          error: err instanceof Error ? err : new Error(String(err)),
        }),
      ),
    );
  });
}
