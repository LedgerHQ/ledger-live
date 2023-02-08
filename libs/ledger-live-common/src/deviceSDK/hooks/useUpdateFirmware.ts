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

  useEffect(() => {
    if (nonce > 0 && deviceId) {
      setIsPerformingTheUpdate(true);
      const sub = updateFirmwareAction({
        deviceId,
      }).subscribe({
        next: setUpdateState,
        complete: () => setIsPerformingTheUpdate(false),
      });

      return () => {
        setIsPerformingTheUpdate(false);
        sub.unsubscribe();
      };
    }
  }, [deviceId, updateFirmwareAction, nonce]);

  const triggerUpdate = isPerformingTheUpdate
    ? undefined
    : () => setNonce(nonce + 1);

  return { updateState, triggerUpdate };
};
