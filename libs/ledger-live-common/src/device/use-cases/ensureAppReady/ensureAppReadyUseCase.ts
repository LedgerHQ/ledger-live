import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { log } from "@ledgerhq/logs";
import { Observable, tap } from "rxjs";
import { getDeprecationConfig, getMinVersion, shouldUpgrade } from "../../../apps";
import { type GetDeprecationConfig, type GetMinVersion } from "./helpers/buildConnectAppDAInput";
import type { ConnectAppInitSideEffects, EnsureAppReadyInput } from "./types";
import { withRetryableRepeat } from "./helpers/withRetryableRepeat";
import { runEnsureAppReadyAttempt } from "./helpers/runEnsureAppReadyAttempt";

export type EnsureAppReadyUseCaseDependencies = {
  getMinVersion: GetMinVersion;
  getDeprecationConfig: GetDeprecationConfig;
  shouldUpgrade: (appName: string, appVersion: string) => boolean;
};

type EnsureAppReadyUseCaseParams = {
  dmk: DeviceManagementKit;
  sessionId: string;
  input: EnsureAppReadyInput;
  deprecationDismissedCurrencyNames: string[];
  sideEffects: ConnectAppInitSideEffects;
  dependencies?: Partial<EnsureAppReadyUseCaseDependencies>;
};

const defaultDependencies: EnsureAppReadyUseCaseDependencies = {
  getDeprecationConfig,
  getMinVersion,
  shouldUpgrade,
};

/**
 * Drives the "make a Ledger app ready" flow for the UI.
 *
 * Connects to the device through the given session, opens (or installs) the requested
 * app and dependencies, and resolves any blocking situation along the way — unlocking the device,
 * allowing the secure connection, deprecation or upgrade warnings, etc. The whole
 * flow is exposed as a stream of states the UI just has to render.
 *
 * Typical UI usage:
 * - start the use case from a `useEffect`;
 * - subscribe and store each emitted state in local state, then render it;
 * - on a `Success` state, read `state.extractedContext` and call `onSuccess`;
 * - on a retryable state, render a retry button wired to `state.retry()`;
 * - completion and observable errors don't need any handling: every meaningful failure
 *   is emitted as a state (`Error` or one of the blocking states) before the observable
 *   completes.
 *
 * @param params - Device session, target app, side effects to fire during the flow, and
 *   optional overrides for the dependencies the use case relies on.
 * @returns An observable of UI states. It completes once the flow ends in a non-retryable
 *   state (`Success`, `Error`, or any blocking state).
 */
export function ensureAppReadyUseCase(
  params: EnsureAppReadyUseCaseParams,
): Observable<EnsureAppReadyState> {
  const { input, sessionId } = params;
  const dependencies = {
    ...defaultDependencies,
    ...params.dependencies,
  };

  log("[EnsureAppReadyUseCase]", "called with", { input, sessionId });

  return withRetryableRepeat(retry =>
    runEnsureAppReadyAttempt({
      ...params,
      dependencies,
      retry,
    }),
  ).pipe(
    tap((state: EnsureAppReadyState) => {
      log("[EnsureAppReadyUseCase]", "next state", { state });
    }),
  );
}
