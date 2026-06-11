import { useEffect, useMemo, useRef, useState } from "react";
import type { DeviceConnectionResult, DeviceExtractedContext } from "@ledgerhq/device-intent";
import {
  ensureAppReadyUseCase,
  type EnsureAppReadyUseCaseDependencies,
} from "@ledgerhq/live-common/device/use-cases/ensureAppReady/ensureAppReadyUseCase";
import type { ConnectAppInitSideEffects } from "@ledgerhq/live-common/device/use-cases/ensureAppReady/types";
import {
  FinalStateType,
  LoadingStateType,
  type EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import { identitiesSlice } from "@ledgerhq/client-ids/store";
import { setLastSeenDeviceInfo } from "~/actions/settings";
import { useDispatch, useSelector } from "~/context/hooks";
import { settingsStoreSelector } from "~/reducers/settings";
import type { InitializationInput } from "../types";
import { buildInitializerDevice } from "./utils/buildInitializerDevice";
import type { InitializerDevice } from "./types";
import { useSourceFlow, type SourceFlow } from "../utils/SourceFlowContext";

type UseDeviceContextInitializerComponentLWMViewModelParams = {
  connectionResult: DeviceConnectionResult;
  deviceInitializationInput: InitializationInput;
  onContextInitialized: (context: DeviceExtractedContext) => void;
  dependencies?: Partial<EnsureAppReadyUseCaseDependencies>;
};

type UseDeviceContextInitializerComponentLWMViewModelResult = {
  state: EnsureAppReadyState;
  device: InitializerDevice;
  sourceFlow: SourceFlow;
};

const LOADING_STATE: EnsureAppReadyState = { type: LoadingStateType.Loading };

export function useDeviceContextInitializerComponentLWMViewModel({
  connectionResult,
  deviceInitializationInput,
  onContextInitialized,
  dependencies,
}: UseDeviceContextInitializerComponentLWMViewModelParams): UseDeviceContextInitializerComponentLWMViewModelResult {
  const dispatch = useDispatch();
  const sourceFlow = useSourceFlow();
  const deprecationDismissedCurrencyNames =
    useSelector(settingsStoreSelector).deprecationDoNotRemind;
  const [state, setState] = useState<EnsureAppReadyState>(LOADING_STATE);
  const completedRef = useRef(false);

  const device = useMemo(() => buildInitializerDevice(connectionResult), [connectionResult]);

  const sideEffects = useMemo<ConnectAppInitSideEffects>(
    () => ({
      onDeviceIdObserved: deviceId => {
        dispatch(identitiesSlice.actions.addDeviceId(deviceId));
      },
      onLastSeenDeviceInfoObserved: ({ modelId, deviceInfo }) => {
        dispatch(
          setLastSeenDeviceInfo({
            modelId,
            deviceInfo,
            apps: [],
          }),
        );
      },
    }),
    [dispatch],
  );

  useEffect(() => {
    const { dmk, sessionId } = connectionResult;
    completedRef.current = false;
    setState(LOADING_STATE);

    const subscription = ensureAppReadyUseCase({
      dmk,
      sessionId,
      input: deviceInitializationInput,
      deprecationDismissedCurrencyNames,
      sideEffects,
      dependencies,
    }).subscribe({
      next: nextState => {
        setState(nextState);

        if (nextState.type === FinalStateType.Success && !completedRef.current) {
          completedRef.current = true;
          onContextInitialized(nextState.extractedContext);
        }
      },
      error: error => {
        setState({
          type: FinalStateType.Error,
          error,
        });
      },
    });

    return () => subscription.unsubscribe();
  }, [
    connectionResult,
    deprecationDismissedCurrencyNames,
    dependencies,
    deviceInitializationInput,
    onContextInitialized,
    sideEffects,
  ]);

  return { state, device, sourceFlow };
}
