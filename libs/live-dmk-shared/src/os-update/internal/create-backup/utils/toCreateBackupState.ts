import {
  CreateBackupStateType,
  type CreateBackupState,
} from "../../../api/model/CreateBackupState";
import { DeviceSituation, type DeviceSituationUpdate } from "../../shared/types";

export const toCreateBackupState = (
  update: DeviceSituationUpdate,
  cancel: () => void,
): CreateBackupState => {
  switch (update.situation) {
    case DeviceSituation.LOCKED:
      return { type: CreateBackupStateType.DEVICE_LOCKED };
    case DeviceSituation.DISCONNECTED:
      return { type: CreateBackupStateType.DEVICE_DISCONNECTED };
    case DeviceSituation.CONNECTION_TIMED_OUT:
      return { type: CreateBackupStateType.CONNECTION_TIMED_OUT, retry: update.retry, cancel };
    default: {
      const unhandled: never = update;
      return unhandled;
    }
  }
};
