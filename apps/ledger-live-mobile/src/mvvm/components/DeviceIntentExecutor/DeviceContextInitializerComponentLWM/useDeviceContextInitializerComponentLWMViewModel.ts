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

type UseDeviceContextInitializerComponentLWMViewModelParams = {
  connectionResult: DeviceConnectionResult;
  deviceInitializationInput: InitializationInput;
  onContextInitialized: (context: DeviceExtractedContext) => void;
  dependencies?: Partial<EnsureAppReadyUseCaseDependencies>;
};

export function useDeviceContextInitializerComponentLWMViewModel({
  connectionResult,
  deviceInitializationInput,
  onContextInitialized,
  dependencies,
}: UseDeviceContextInitializerComponentLWMViewModelParams): EnsureAppReadyState {
  const dispatch = useDispatch();
  const deprecationDismissedCurrencyNames =
    useSelector(settingsStoreSelector).deprecationDoNotRemind;
  const [state, setState] = useState<EnsureAppReadyState>({ type: LoadingStateType.Loading });
  const completedRef = useRef(false);

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
    setState({ type: LoadingStateType.Loading });

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

  return state;
}
