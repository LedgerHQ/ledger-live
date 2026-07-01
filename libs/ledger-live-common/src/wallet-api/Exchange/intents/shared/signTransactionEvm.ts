import { defer, of, type Observable } from "rxjs";
import { catchError, filter, finalize, map } from "rxjs/operators";
import {
  DeviceActionStatus,
  hexaStringToBuffer,
  UserInteractionRequired,
} from "@ledgerhq/device-management-kit";
import { SignTransactionDAStep } from "@ledgerhq/device-signer-kit-ethereum";
import { combine } from "@ledgerhq/coin-evm/logic/combine";
import type { DeviceConnectionResult } from "@ledgerhq/device-intent";
import { DmkSignerEth } from "@ledgerhq/live-signer-evm";
import { mapDmkSignerError } from "./mapDmkSignerError";

export type SignTransactionEvmRunState =
  | { type: "loading-context" }
  | { type: "awaiting-confirmation" }
  | { type: "signing" }
  | { type: "signed"; signedTxHex: string }
  | { type: "failed"; error: Error };

/**
 * Run an EVM transaction signing flow through the production CAL-wired
 * DMK Ethereum signer so swap/approval calldata can clear-sign when
 * device contexts are available instead of falling back to blind signing.
 */
export function runSignTransactionEvm(
  connectionResult: DeviceConnectionResult,
  unsignedTxHex: string,
  derivationPath: string,
  errorLabel: string,
): Observable<SignTransactionEvmRunState> {
  return defer(() => {
    const buffer = hexaStringToBuffer(unsignedTxHex);
    if (!buffer) {
      throw new Error("Failed to encode unsigned EVM transaction to bytes");
    }

    const { dmk, sessionId } = connectionResult;
    const signer = new DmkSignerEth(dmk, sessionId).signer;
    const { observable, cancel } = signer.signTransaction(derivationPath, buffer, {
      skipOpenApp: true,
    });

    return observable.pipe(
      finalize(cancel),
      map((state): SignTransactionEvmRunState | null => {
        if (state.status === DeviceActionStatus.Error) {
          return {
            type: "failed",
            error: mapDmkSignerError(state.error, errorLabel),
          };
        }
        if (state.status === DeviceActionStatus.Completed) {
          return { type: "signed", signedTxHex: combine(unsignedTxHex, state.output) };
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
      filter((s): s is SignTransactionEvmRunState => s !== null),
    );
  }).pipe(
    catchError(err =>
      of<SignTransactionEvmRunState>({
        type: "failed",
        error: err instanceof Error ? err : new Error(String(err)),
      }),
    ),
  );
}
