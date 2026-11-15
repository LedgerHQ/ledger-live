import {
  RestoreBackupStateType,
  type RestoreBackupState,
} from "../../../api/model/RestoreBackupState";
import { DeviceSituation, type DeviceSituationUpdate } from "../../shared/types";

export const toRestoreBackupState = (
  update: DeviceSituationUpdate,
  cancel: () => void,
): RestoreBackupState => {
  switch (update.situation) {
    case DeviceSituation.LOCKED:
      return { type: RestoreBackupStateType.DEVICE_LOCKED };
    case DeviceSituation.DISCONNECTED:
      return { type: RestoreBackupStateType.DEVICE_DISCONNECTED };
    case DeviceSituation.CONNECTION_TIMED_OUT:
      return { type: RestoreBackupStateType.CONNECTION_TIMED_OUT, retry: update.retry, cancel };
    default: {
      const unhandled: never = update;
      return unhandled;
    }
  }
};
