import type { Job } from "@features/platform-device-intent";
import { Observable, type Subscription } from "rxjs";
import type {
  VerifyAddressIntentInput,
  VerifyAddressIntentJobState,
  VerifyAddressIntentResult,
} from "./types";

function toError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) return error;
  if (typeof error === "object" && error !== null) {
    const tag = (error as { _tag?: unknown })._tag;
    if (typeof tag === "string") return new Error(tag);
  }
  return new Error(fallbackMessage);
}

/**
 * Case only carries meaning for some address encodings. Hex (`0x…`) addresses
 * use EIP-55 checksum casing that a device and the app can legitimately format
 * differently, so they are compared case-insensitively. Every other encoding
 * (Base58 for Solana/Tron, Bech32, …) is case-significant, so it is compared
 * exactly — otherwise a genuine mismatch could be reported as `verified`.
 */
function addressesMatch(expected: string, reported: string): boolean {
  const left = expected.trim();
  const right = reported.trim();

  return left.startsWith("0x") && right.startsWith("0x")
    ? left.toLowerCase() === right.toLowerCase()
    : left === right;
}

/**
 * Verify a receive address on the device Secure Screen.
 *
 * The executor already owns the device session and opened the app during
 * Phase 2, so the job hands the live session to the host-injected
 * {@link VerifyAddressIntentInput.startAddressVerification} and maps its
 * normalized {@link VerifyAddressDeviceState} stream to
 * {@link VerifyAddressIntentJobState}. The host decides *how* verification
 * happens per coin family (DMK-native signer or legacy `receive`); this job
 * stays signer-agnostic.
 *
 * Outcomes (`JobState`, then the `Result` reported through `onResult`):
 * - device request in flight → `addressDisplayed` (non-terminal, once per attempt), no result.
 * - device output matches the expected address → `verified` (terminal).
 * - device output differs → `mismatch` (terminal), so the host can warn the user.
 * - user refuses on device → `cancelled` with a `retry` handler (non-terminal), result `refused`.
 * - device app cannot display the address → `unsupported` (terminal).
 * - any other device failure → observable error (executor's shared error screen), no result.
 */
export const verifyAddressIntentJob: Job<
  VerifyAddressIntentJobState,
  VerifyAddressIntentInput,
  VerifyAddressIntentResult
> = ({ deviceConnectionResult, input, onResult }) =>
  new Observable<VerifyAddressIntentJobState>(subscriber => {
    const { connectedDevice, compatDeviceName } = deviceConnectionResult;
    const { expectedAddress, startAddressVerification } = input;

    let innerSubscription: Subscription | undefined;
    let cancelDeviceAction: (() => void) | undefined;
    let runToken = 0;

    const run = () => {
      const currentRunToken = ++runToken;
      innerSubscription?.unsubscribe();
      cancelDeviceAction?.();

      subscriber.next({
        type: "verifying",
        deviceModelId: connectedDevice.modelId,
        deviceName: compatDeviceName,
      });

      const { observable, cancel } = startAddressVerification(deviceConnectionResult);
      cancelDeviceAction = cancel;
      let hasDisplayedAddress = false;

      innerSubscription = observable.subscribe({
        next: state => {
          if (subscriber.closed || currentRunToken !== runToken) return;

          switch (state.type) {
            case "awaiting-confirmation":
              if (hasDisplayedAddress) return;
              hasDisplayedAddress = true;
              subscriber.next({ type: "addressDisplayed" });
              return;
            case "confirmed": {
              const reportedAddress = state.address;
              const ending = addressesMatch(expectedAddress, reportedAddress)
                ? ({ type: "verified", address: reportedAddress } as const)
                : ({ type: "mismatch", expectedAddress, reportedAddress } as const);
              onResult(ending);
              subscriber.next(ending);
              subscriber.complete();
              return;
            }
            case "refused":
              onResult({ type: "refused" });
              // Non-terminal: keep the intent open so the user can retry.
              subscriber.next({ type: "cancelled", retry: run });
              return;
            case "unsupported": {
              const ending = {
                type: "unsupported",
                error:
                  state.error ?? new Error("Address verification not supported on this device"),
              } as const;
              onResult(ending);
              subscriber.next(ending);
              subscriber.complete();
              return;
            }
          }
        },
        error: error => {
          if (subscriber.closed || currentRunToken !== runToken) return;
          subscriber.error(toError(error, "Verify address failed"));
        },
      });
    };

    run();

    return () => {
      runToken += 1;
      innerSubscription?.unsubscribe();
      cancelDeviceAction?.();
    };
  });
