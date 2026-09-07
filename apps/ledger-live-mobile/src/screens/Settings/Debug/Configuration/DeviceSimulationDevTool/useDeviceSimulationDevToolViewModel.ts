import { useCallback, useMemo } from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useSelector, useDispatch } from "~/context/hooks";
import { unsafe_setKnownDeviceModelIds } from "~/actions/settings";
import { knownDeviceModelIdsSelector } from "~/reducers/settings";
import { QA_DEVICE_MODELS, QA_DEVICE_MODEL_RESET_PAYLOAD } from "./qaDeviceModels";

export function useDeviceSimulationDevToolViewModel() {
  const dispatch = useDispatch();
  const knownDeviceModelIds = useSelector(knownDeviceModelIdsSelector);

  const isDeviceSeen = useCallback(
    (modelId: DeviceModelId) => Boolean(knownDeviceModelIds[modelId]),
    [knownDeviceModelIds],
  );

  const toggleDevice = useCallback(
    (modelId: DeviceModelId, seen: boolean) => {
      dispatch(unsafe_setKnownDeviceModelIds({ [modelId]: seen }));
    },
    [dispatch],
  );

  const resetDevices = useCallback(() => {
    dispatch(unsafe_setKnownDeviceModelIds(QA_DEVICE_MODEL_RESET_PAYLOAD));
  }, [dispatch]);

  const currentHistoryLabels = useMemo(
    () =>
      QA_DEVICE_MODELS.filter(model => knownDeviceModelIds[model.id]).map(model => model.labelKey),
    [knownDeviceModelIds],
  );

  const isResetEnabled = QA_DEVICE_MODELS.some(model => knownDeviceModelIds[model.id]);

  return {
    deviceModels: QA_DEVICE_MODELS,
    knownDeviceModelIds,
    currentHistoryLabels,
    isResetEnabled,
    isDeviceSeen,
    toggleDevice,
    resetDevices,
  };
}

export type DeviceSimulationDevToolViewModel = ReturnType<
  typeof useDeviceSimulationDevToolViewModel
>;
