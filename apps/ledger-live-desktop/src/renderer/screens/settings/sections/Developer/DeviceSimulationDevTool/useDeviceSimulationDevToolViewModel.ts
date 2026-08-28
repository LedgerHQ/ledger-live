import { useCallback, useMemo } from "react";
import { DeviceModelId } from "@ledgerhq/devices";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { saveSettings } from "~/renderer/actions/settings";
import { devicesModelListSelector } from "~/renderer/reducers/settings";
import { QA_DEVICE_MODELS } from "LLD/features/LargeScreenUpsell/constants/qaDeviceModels";

export function useDeviceSimulationDevToolViewModel() {
  const dispatch = useDispatch();
  const devicesModelList = useSelector(devicesModelListSelector);

  const isDeviceSeen = useCallback(
    (modelId: DeviceModelId) => devicesModelList.includes(modelId),
    [devicesModelList],
  );

  const toggleDevice = useCallback(
    (modelId: DeviceModelId, seen: boolean) => {
      if (seen) {
        const next = devicesModelList.includes(modelId)
          ? devicesModelList
          : [...devicesModelList, modelId];
        dispatch(saveSettings({ devicesModelList: next }));
        return;
      }

      dispatch(
        saveSettings({
          devicesModelList: devicesModelList.filter(id => id !== modelId),
        }),
      );
    },
    [devicesModelList, dispatch],
  );

  const resetDevices = useCallback(() => {
    dispatch(saveSettings({ devicesModelList: [] }));
  }, [dispatch]);

  const currentHistoryLabels = useMemo(
    () =>
      QA_DEVICE_MODELS.filter(model => devicesModelList.includes(model.id)).map(
        model => model.labelKey,
      ),
    [devicesModelList],
  );

  const isResetEnabled = devicesModelList.length > 0;

  return {
    deviceModels: QA_DEVICE_MODELS,
    devicesModelList,
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
