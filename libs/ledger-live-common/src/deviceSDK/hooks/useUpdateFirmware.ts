import { useEffect, useState } from "react";
import {
  updateFirmwareAction as defaultUpdateFirmwareAction,
  UpdateFirmwareActionState,
  initialState,
} from "../actions/updateFirmware";

export type UseUpdateFirmwareArgs = {
  updateFirmwareAction?: typeof defaultUpdateFirmwareAction;
  deviceId?: string;
};

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

  useEffect(() => {
    if (nonce > 0 && deviceId) {
      const sub = updateFirmwareAction({
        deviceId,
      }).subscribe({
        next: setUpdateState,
      });

      return () => {
        sub.unsubscribe();
      };
    }
  }, [deviceId, updateFirmwareAction, nonce]);

  const triggerUpdate = () => setNonce(nonce + 1);

  return { updateState, triggerUpdate };
};
