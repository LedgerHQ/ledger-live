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

// to be used in an E2E test context
let mockedUpdateFirmwareAction: typeof defaultUpdateFirmwareAction | undefined;

export function mockUpdateFirmwareAction(mockedAction: typeof defaultUpdateFirmwareAction) {
  mockedUpdateFirmwareAction = mockedAction;
}

// This hook is not yet 100% thought through, it's only here so we can test the new firmware update action
// without using the CLI. Once we actually intend to integrate the firmware update, we should rethink
// if this is the best approach

export const useUpdateFirmware = ({
  updateFirmwareAction = mockedUpdateFirmwareAction ?? defaultUpdateFirmwareAction,
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
