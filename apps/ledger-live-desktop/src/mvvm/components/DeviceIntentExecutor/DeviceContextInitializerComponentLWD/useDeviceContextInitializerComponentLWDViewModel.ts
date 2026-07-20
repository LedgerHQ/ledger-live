import { useEffect, useMemo, useRef, useState } from "react";
import type { DeviceConnectionResult, DeviceExtractedContext } from "@ledgerhq/device-intent";
import { identitiesSlice } from "@domain/entity-client-identity";
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
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { addNewDeviceModel, setLastSeenDeviceInfo } from "~/renderer/actions/settings";
import { settingsStoreSelector } from "~/renderer/reducers/settings";
import type { InitializationInput } from "../types";
import type { InitializerDevice } from "./types";
import { buildInitializerDevice } from "./utils/buildInitializerDevice";

type UseDeviceContextInitializerComponentLWDViewModelParams = {
  connectionResult: DeviceConnectionResult;
  deviceInitializationInput: InitializationInput;
  onContextInitialized: (context: DeviceExtractedContext) => void;
  dependencies?: Partial<EnsureAppReadyUseCaseDependencies>;
};

type UseDeviceContextInitializerComponentLWDViewModelResult = {
  state: EnsureAppReadyState;
  device: InitializerDevice;
};

const LOADING_STATE: EnsureAppReadyState = { type: LoadingStateType.Loading };

export function useDeviceContextInitializerComponentLWDViewModel({
  connectionResult,
  deviceInitializationInput,
  onContextInitialized,
  dependencies,
}: UseDeviceContextInitializerComponentLWDViewModelParams): UseDeviceContextInitializerComponentLWDViewModelResult {
  const dispatch = useDispatch();
  const deprecationDismissedCurrencyNames = useSelector(
    state => settingsStoreSelector(state).deprecationDoNotRemind,
  );
  const [state, setState] = useState<EnsureAppReadyState>(LOADING_STATE);
  const completedRef = useRef(false);

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

  return { state, device };
}
