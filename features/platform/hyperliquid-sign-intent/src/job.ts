import { isDeviceDisconnectedError, type Job } from "@features/platform-device-intent";
import { Observable } from "rxjs";
import type {
  HyperliquidSignIntentInput,
  HyperliquidSignIntentJobState,
  HyperliquidSignIntentResult,
} from "./types";

const USER_REFUSED_ERROR_NAME = "UserRefusedOnDevice";

/** Matched by name: `instanceof` fails across duplicated `@ledgerhq/errors`. */
function isUserRefusal(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === USER_REFUSED_ERROR_NAME
  );
}

function readDmkErrorTag(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const { _tag: tag } = error as { _tag?: unknown };
  return typeof tag === "string" ? tag : undefined;
}

/** DMK device-action errors are plain `{ _tag }` objects, not `Error` instances. */
function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(readDmkErrorTag(error) ?? String(error), { cause: error });
}

/**
 * Sign Hyperliquid actions on the session the executor opened.
 *
 * Outcomes, each reported once through `onResult` before the job completes:
 * - the device returns signatures → `signed`.
 * - the user refuses on the device → `refused`.
 * - any other failure → `failed`, rendered as `error`.
 *
 * A disconnection escapes as an observable error, so the executor shows its reconnect screen
 * and runs the job again once the device is back.
 */
export const hyperliquidSignIntentJob: Job<
  HyperliquidSignIntentJobState,
  HyperliquidSignIntentInput,
  HyperliquidSignIntentResult
> = ({ deviceConnectionResult, input, onResult }) =>
  new Observable<HyperliquidSignIntentJobState>(subscriber => {
    const { dmk, sessionId, connectedDevice, compatDeviceName } = deviceConnectionResult;

    subscriber.next({
      type: "signing",
      deviceModelId: connectedDevice.modelId,
      deviceName: compatDeviceName,
    });

    const sign = async () => input.signOnSession({ dmk, sessionId, connectedDevice });

    sign().then(
      signatures => {
        if (subscriber.closed) return;
        onResult({ type: "signed", signatures });
        subscriber.next({ type: "signed" });
        subscriber.complete();
      },
      (error: unknown) => {
        if (subscriber.closed) return;
        if (isDeviceDisconnectedError(error)) {
          subscriber.error(error);
          return;
        }
        if (isUserRefusal(error)) {
          onResult({ type: "refused", error: toError(error) });
          subscriber.next({ type: "refused" });
        } else {
          const failure = toError(error);
          onResult({ type: "failed", error: failure });
          subscriber.next({ type: "error", error: failure });
        }
        subscriber.complete();
      },
    );
  });
