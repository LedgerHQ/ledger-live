import { useCallback, useEffect, useState } from "react";
import {
  updateFirmwareAction as defaultUpdateFirmwareAction,
  UpdateFirmwareActionState,
  initialState,
} from "../actions/updateFirmware";

export type UseUpdateFirmwareArgs = {
  updateFirmwareAction?: typeof defaultUpdateFirmwareAction;
  deviceId: string;
};

/**
 * Hook used to trigger the update of a firmware, it isn't triggered right away but rather returns
 * a function that triggers it. The function can be called multiple times in order to implement a
 * retry strategy
 * @param Args Object containing the arguments of the hook: a deviceId and an optional device action to used (useful for mocking)
 * @returns An object containing the current state of the update and the trigger update function
 */
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

  useEffect(() => {
    if (nonce > 0) {
      const sub = updateFirmwareAction({
        deviceId,
      }).subscribe({
        next: (state) => setUpdateState(state),
      });

      return () => {
        sub.unsubscribe();
      };
    }
  }, [deviceId, updateFirmwareAction, nonce]);

  const triggerUpdate = useCallback(() => setNonce((nonce) => nonce + 1), []);

  return { updateState, triggerUpdate };
};
