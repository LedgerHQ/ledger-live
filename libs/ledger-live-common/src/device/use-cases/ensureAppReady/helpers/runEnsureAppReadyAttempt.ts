import isEqual from "lodash/isEqual";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import {
  ConnectAppDeviceAction,
  EnsureAppReadyDeviceAction,
  FinalStateType,
  LoadingStateType,
  type EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import { log } from "@ledgerhq/logs";
import { Observable, distinctUntilChanged } from "rxjs";
import {
  buildConnectAppDeviceActionInput,
  type GetDeprecationConfig,
  type GetMinVersion,
} from "./buildConnectAppDAInput";
import { buildFinalState } from "./buildFinalState";
import { ConnectAppSideEffectsHandler } from "./ConnectAppSideEffectsHandler";
import type { ConnectAppInitSideEffects, EnsureAppReadyInput } from "../types";

export type RunEnsureAppReadyAttemptDependencies = {
  getMinVersion: GetMinVersion;
  getDeprecationConfig: GetDeprecationConfig;
  shouldUpgrade: (appName: string, appVersion: string) => boolean;
};

export type RunEnsureAppReadyAttemptParams = {
  dmk: DeviceManagementKit;
  sessionId: string;
  input: EnsureAppReadyInput;
  deprecationDismissedCurrencyNames: string[];
  sideEffects: ConnectAppInitSideEffects;
  dependencies: RunEnsureAppReadyAttemptDependencies;
  retry: () => void;
};

export function runEnsureAppReadyAttempt(
  params: RunEnsureAppReadyAttemptParams,
): Observable<EnsureAppReadyState> {
  const { dmk, sessionId, input, dependencies, retry } = params;

  return new Observable<EnsureAppReadyState>(observer => {
    observer.next({ type: LoadingStateType.Loading });

    const connectAppInput = buildConnectAppDeviceActionInput({
      dmk,
      sessionId,
      ensureAppReadyInput: input,
      getMinVersion: dependencies.getMinVersion,
      getDeprecationConfig: dependencies.getDeprecationConfig,
      unlockTimeout: 60_000, // 1 minute
    });
    log("[EnsureAppReadyUseCase]", "connectAppInput", { connectAppInput });
    const connectAppDeviceAction = new ConnectAppDeviceAction({
      input: connectAppInput,
    });
    const connectedDevice = dmk.getConnectedDevice({ sessionId });

    const deviceAction = new EnsureAppReadyDeviceAction({
      input: {
        appName: input.appName,
        deprecation: input.deprecation,
        deprecationDismissedCurrencyNames: params.deprecationDismissedCurrencyNames,
        connectAppDeviceAction,
        observer,
        retry,
        additionalSnapshotHandlers: [
          new ConnectAppSideEffectsHandler({
            sideEffects: params.sideEffects,
            deviceModelId: connectedDevice.modelId,
          }),
        ],
      },
      dependencies: {
        shouldUpgrade: dependencies.shouldUpgrade,
        buildFinalState: ({ deviceMetadata, currentApp, derivation }) =>
          buildFinalState({
            expectedAccount: input.expectedAccount,
            deviceMetadata,
            currentApp,
            derivation,
          }),
      },
    });

    const execution = dmk.executeDeviceAction({
      sessionId,
      deviceAction,
    });

    const subscription = execution.observable.subscribe({
      next: state => {
        // Note: this can only happen with an unexpected error.
        if (state.status === DeviceActionStatus.Error) {
          log("[EnsureAppReadyUseCase]", "error state emitted", { state });
          observer.next({
            type: FinalStateType.Error,
            error: state.error,
          });
        }
      },
      error: error => {
        log("[EnsureAppReadyUseCase]", "error emitted", { error });
        observer.error(error);
      },
      complete: () => observer.complete(),
    });

    return () => {
      subscription.unsubscribe();
      execution.cancel();
    };
  }).pipe(distinctUntilChanged(isEqual));
}
