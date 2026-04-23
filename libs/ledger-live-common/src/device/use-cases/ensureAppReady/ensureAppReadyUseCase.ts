import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { DeviceActionStatus } from "@ledgerhq/device-management-kit";
import {
  ConnectAppDeviceAction,
  EnsureAppReadyDeviceAction,
  FinalStateType,
  type EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import { log } from "@ledgerhq/logs";
import { Observable, tap } from "rxjs";
import { shouldUpgrade } from "../../../apps";
import { buildConnectAppDeviceActionInput } from "./helpers/buildConnectAppDAInput";
import { buildFinalState } from "./helpers/buildFinalState";
import { ConnectAppSideEffectsHandler } from "./helpers/ConnectAppSideEffectsHandler";
import type { ConnectAppInitSideEffects, EnsureAppReadyInput } from "./types";

type EnsureAppReadyUseCaseParams = {
  dmk: DeviceManagementKit;
  sessionId: string;
  input: EnsureAppReadyInput;
  deprecationDismissedCurrencyNames: string[];
  sideEffects: ConnectAppInitSideEffects;
};

/**
 * How to use this use case:
 * - the UI starts it in a useEffect.
 * - it consumes all the emitted states and puts them in a local state
 * - it displays the state.
 * - if the state is "type": "done", it gets the extracted context and calls the onSuccess callback.
 * - on error and completion, it does not do anything.
 *     -> TBD: not sure about error, but normally ALL errors should be emitted inside a EnsureAppReadyState
 */
export function ensureAppReadyUseCase(
  params: EnsureAppReadyUseCaseParams,
): Observable<EnsureAppReadyState> {
  const { dmk, sessionId, input } = params;

  log("[EnsureAppReadyUseCase]", "called with", { input, sessionId });

  return new Observable<EnsureAppReadyState>(observer => {
    const connectAppInput = buildConnectAppDeviceActionInput({
      dmk,
      sessionId,
      ensureAppReadyInput: input,
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
        additionalSnapshotHandlers: [
          new ConnectAppSideEffectsHandler({
            sideEffects: params.sideEffects,
            deviceModelId: connectedDevice.modelId,
          }),
        ],
      },
      dependencies: {
        shouldUpgrade,
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
  }).pipe(
    tap((state: EnsureAppReadyState) => {
      log("[EnsureAppReadyUseCase]", "next state", { state });
    }),
  );
}
