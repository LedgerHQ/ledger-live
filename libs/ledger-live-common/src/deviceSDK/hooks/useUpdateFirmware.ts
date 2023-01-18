import { useEffect, useState } from "react";
import useLatestFirmware from "../../hooks/useLatestFirmware";
import {
  updateFirmwareAction as defaultUpdateFirmwareAction,
  UpdateFirmwareActionState,
  initialState,
} from "../actions/updateFirmware";
import { useGetDeviceInfo } from "./getDeviceInfo";

export type UseUpdateFirmwareArgs = {
  updateFirmwareAction?: typeof defaultUpdateFirmwareAction;
  deviceId?: string;
};

// This hook is not yet 100% thought through, it's only here so we can test the new firmware update action
// without using the CLI. Once we actually intend to integrate the firmware update, we should rethink
// if this is the best approach

export const useUpdateFirmware = ({
  updateFirmwareAction = defaultUpdateFirmwareAction,
  deviceId,
}: UseUpdateFirmwareArgs): {
  updateState: UpdateFirmwareActionState;
  triggerUpdate?: () => void;
} => {
  const [updateState, setUpdateState] =
    useState<UpdateFirmwareActionState>(initialState);
  const [nonce, setNonce] = useState(0);
  const [isPerformingTheUpdate, setIsPerformingTheUpdate] = useState(false);
  const { deviceInfo } = useGetDeviceInfo({ deviceId });
  const latestFirmware = useLatestFirmware(deviceInfo);

  useEffect(() => {
    if (latestFirmware && nonce > 0 && deviceId) {
      setIsPerformingTheUpdate(true);
      const sub = updateFirmwareAction({
        deviceId,
        updateContext: latestFirmware,
      }).subscribe({
        next: setUpdateState,
        complete: () => setIsPerformingTheUpdate(false),
      });

      return () => {
        setIsPerformingTheUpdate(false);
        sub.unsubscribe();
      };
    }
  }, [deviceId, updateFirmwareAction, latestFirmware, nonce]);

  const triggerUpdate =
    isPerformingTheUpdate || !latestFirmware
      ? undefined
      : () => setNonce(nonce + 1);

  return { updateState, triggerUpdate };
};
