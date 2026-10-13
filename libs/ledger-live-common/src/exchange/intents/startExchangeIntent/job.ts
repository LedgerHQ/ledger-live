import type { DeviceConnectionResult, Job } from "@features/platform-device-intent";
import { Observable, take } from "rxjs";
import { startNewExchangeTransaction } from "../../platform/startExchange";
import { getExchangeMainAccounts } from "../exchangeAppRequest";
import { createSessionTransport, normalizeError, toLegacyDevice } from "../shared";
import type {
  StartExchangeIntentInput,
  StartExchangeIntentJobState,
  StartExchangeIntentResult,
} from "./types";

function getSigningAppName(input: StartExchangeIntentInput): string | undefined {
  const { mainFromAccount } = getExchangeMainAccounts(input.exchange);
  return mainFromAccount?.currency.managerAppName || undefined;
}

/**
 * The version of `appName` the device listed while the executor prepared it, read from the session
 * state without sending anything to the device. The state replays on subscription; anything else,
 * or a device that was not listed, gives no version rather than blocking or failing the start.
 */
function getInstalledAppVersion(
  connection: DeviceConnectionResult,
  appName: string,
): string | undefined {
  let version: string | undefined;
  try {
    connection.dmk
      .getDeviceSessionState({ sessionId: connection.sessionId })
      .pipe(take(1))
      .subscribe({
        next: state => {
          if ("installedApps" in state) {
            version = state.installedApps.find(app => app.versionName === appName)?.version;
          }
        },
        error: () => undefined,
      })
      .unsubscribe();
  } catch {
    return undefined;
  }
  return version;
}

/**
 * Asks the Exchange app for a new transaction nonce. The executor has already opened the Exchange
 * app, so this only talks to it over the live session.
 */
export const startExchangeIntentJob: Job<
  StartExchangeIntentJobState,
  StartExchangeIntentInput,
  StartExchangeIntentResult
> = ({ deviceConnectionResult, deviceExtractedContext, input, onResult }) =>
  new Observable<StartExchangeIntentJobState>(subscriber => {
    const device = toLegacyDevice(deviceConnectionResult);
    let cancelled = false;

    subscriber.next({ type: "starting", deviceModelId: device.modelId });

    const run = async () => {
      const signingAppName = getSigningAppName(input);
      const nonce = await startNewExchangeTransaction(
        createSessionTransport(deviceConnectionResult),
        {
          exchangeType: input.exchangeType,
          provider: input.provider,
          appVersion: deviceExtractedContext.currentAppVersion || undefined,
        },
        () => cancelled,
      );
      if (cancelled || nonce === undefined) return;

      const signingAppVersion = signingAppName
        ? getInstalledAppVersion(deviceConnectionResult, signingAppName)
        : undefined;
      onResult({
        status: "started",
        nonce,
        device,
        ...(deviceExtractedContext.currentAppVersion
          ? { exchangeAppVersion: deviceExtractedContext.currentAppVersion }
          : {}),
        ...(signingAppName ? { signingAppName } : {}),
        ...(signingAppVersion ? { signingAppVersion } : {}),
      });
      subscriber.next({ type: "nonce-ready", nonce });
      subscriber.complete();
    };

    run().catch(error => {
      if (cancelled) return;
      const normalized = normalizeError(error);
      onResult({ status: "failed", error: normalized, device });
      subscriber.next({ type: "error", error: normalized });
      subscriber.complete();
    });

    return () => {
      cancelled = true;
    };
  });
