import { useEffect, useMemo, useRef, useState } from "react";
import type {
  DeviceConnectionResult,
  DeviceExtractedContext,
} from "@features/platform-device-intent";
import { identitiesSlice } from "@domain/entity-client-identity";
import {
  ensureAppReadyUseCase,
  type EnsureAppReadyUseCaseDependencies,
} from "@ledgerhq/live-common/device/use-cases/ensureAppReady/ensureAppReadyUseCase";
import type { ConnectAppInitSideEffects } from "@ledgerhq/live-common/device/use-cases/ensureAppReady/types";
import {
  BlockingStateType,
  FinalStateType,
  getEnsureAppReadyFailure,
  LoadingStateType,
  type EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import { useDeviceIntentTracking } from "@ledgerhq/live-dmk-shared/react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { addNewDeviceModel, setLastSeenDeviceInfo } from "~/renderer/actions/settings";
import { settingsStoreSelector } from "~/renderer/reducers/settings";
import type { InitializationInput } from "../types";
import { getConnectedDeviceTrackingProperties } from "../utils/trackDeviceIntent";
import type { InitializerDevice } from "./types";
import { buildInitializerDevice } from "./utils/buildInitializerDevice";

type UseContextInitializerViewModelParams = {
  connectionResult: DeviceConnectionResult;
  deviceInitializationInput: InitializationInput;
  onContextInitialized: (context: DeviceExtractedContext) => void;
  dependencies?: Partial<EnsureAppReadyUseCaseDependencies>;
  onInitializationFailed?: (error: unknown) => void;
};

type UseContextInitializerViewModelResult = {
  state: EnsureAppReadyState;
  device: InitializerDevice;
};

const LOADING_STATE: EnsureAppReadyState = { type: LoadingStateType.Loading };

// Blocking states end the initialization; retryable and interaction states keep it running.
const BLOCKING_STATES: ReadonlySet<string> = new Set(Object.values(BlockingStateType));

function initializationFailureOf(state: EnsureAppReadyState): unknown {
  if (state.type === FinalStateType.Error) return state.error;
  if (!BLOCKING_STATES.has(state.type)) return undefined;
  const error = new Error(`Device initialization blocked: ${state.type}`);
  error.name = state.type;
  return error;
}

export function useContextInitializerViewModel({
  connectionResult,
  deviceInitializationInput,
  onContextInitialized,
  dependencies,
  onInitializationFailed,
}: UseContextInitializerViewModelParams): UseContextInitializerViewModelResult {
  const dispatch = useDispatch();
  const deprecationDismissedCurrencyNames = useSelector(
    state => settingsStoreSelector(state).deprecationDoNotRemind,
  );
  const [state, setState] = useState<EnsureAppReadyState>(LOADING_STATE);
  const completedRef = useRef(false);
  const { reportFailure } = useDeviceIntentTracking();

  const device = useMemo(() => buildInitializerDevice(connectionResult), [connectionResult]);

  const sideEffects = useMemo<ConnectAppInitSideEffects>(
    () => ({
      onDeviceIdObserved: deviceId => {
        dispatch(identitiesSlice.actions.addDeviceId(deviceId));
      },
      onLastSeenDeviceInfoObserved: ({ modelId, deviceInfo, apps, latestFirmware }) => {
        dispatch(
          setLastSeenDeviceInfo({
            lastSeenDevice: {
              modelId,
              deviceInfo,
              apps,
            },
            latestFirmware,
          }),
        );
        dispatch(addNewDeviceModel({ deviceModelId: modelId }));
      },
    }),
    [dispatch],
  );

  useEffect(() => {
    const { dmk, sessionId } = connectionResult;
    const trackingDevice = getConnectedDeviceTrackingProperties(connectionResult.connectedDevice);
    const handleState = (nextState: EnsureAppReadyState) => {
      setState(nextState);
      reportFailure(getEnsureAppReadyFailure(nextState, trackingDevice));
      const failure = initializationFailureOf(nextState);
      if (failure) onInitializationFailed?.(failure);
    };
    completedRef.current = false;
    handleState(LOADING_STATE);

    const subscription = ensureAppReadyUseCase({
      dmk,
      sessionId,
      input: deviceInitializationInput,
      deprecationDismissedCurrencyNames,
      sideEffects,
      dependencies,
    }).subscribe({
      next: nextState => {
        handleState(nextState);

        if (nextState.type === FinalStateType.Success && !completedRef.current) {
          completedRef.current = true;
          onContextInitialized(nextState.extractedContext);
        }
      },
      error: error => {
        handleState({ type: FinalStateType.Error, error });
      },
    });

    return () => subscription.unsubscribe();
  }, [
    connectionResult,
    deprecationDismissedCurrencyNames,
    dependencies,
    deviceInitializationInput,
    onContextInitialized,
    onInitializationFailed,
    reportFailure,
    sideEffects,
  ]);

  return { state, device };
}
