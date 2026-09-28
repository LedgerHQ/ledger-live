import {
  CreateBackupStateType,
  type CreateBackupState,
} from "../../../api/model/CreateBackupState";
import { DeviceSituation } from "../../shared/types";

export const toCreateBackupState = (situation: DeviceSituation): CreateBackupState => {
  switch (situation) {
    case DeviceSituation.LOCKED:
      return { type: CreateBackupStateType.DEVICE_LOCKED };
    case DeviceSituation.DISCONNECTED:
      return { type: CreateBackupStateType.DEVICE_DISCONNECTED };
    default: {
      const unhandled: never = situation;
      return unhandled;
    }
  }
};
