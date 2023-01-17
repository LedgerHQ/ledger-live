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
  deviceId: string;
};

export const useUpdateFirmware = ({
  updateFirmwareAction = defaultUpdateFirmwareAction,
  deviceId,
}: UseUpdateFirmwareArgs): {
  updateState: UpdateFirmwareActionState;
  triggerUpdate: () => void;
} => {
  const [updateState, setUpdateState] =
    useState<UpdateFirmwareActionState>(initialState);
  const [nonce, setNonce] = useState(0);
  const { deviceInfo } = useGetDeviceInfo({ deviceId });
  const latestFirmware = useLatestFirmware(deviceInfo);

  useEffect(() => {
    if (latestFirmware && nonce > 0) {
      const sub = updateFirmwareAction({
        deviceId,
        updateContext: latestFirmware,
      }).subscribe(setUpdateState);

      return () => sub.unsubscribe();
    }
  }, [deviceId, updateFirmwareAction, latestFirmware, nonce]);

  const triggerUpdate = () => setNonce(nonce + 1);

  return { updateState, triggerUpdate };
};
