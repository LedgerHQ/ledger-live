import {
  RestoreBackupStateType,
  type RestoreBackupState,
} from "../../../api/model/RestoreBackupState";
import { DeviceSituation } from "../../shared/types";

export const toRestoreBackupState = (situation: DeviceSituation): RestoreBackupState => {
  switch (situation) {
    case DeviceSituation.LOCKED:
      return { type: RestoreBackupStateType.DEVICE_LOCKED };
    case DeviceSituation.DISCONNECTED:
      return { type: RestoreBackupStateType.DEVICE_DISCONNECTED };
    default: {
      const unhandled: never = situation;
      return unhandled;
    }
  }
};
