import {
  ApplyUpdatesStateType,
  type ApplyUpdatesState,
} from "../../../api/model/ApplyUpdatesState";
import { DeviceSituation } from "../../shared/types";

export const toApplyUpdatesState = (situation: DeviceSituation): ApplyUpdatesState => {
  switch (situation) {
    case DeviceSituation.LOCKED:
      return { type: ApplyUpdatesStateType.DEVICE_LOCKED };
    case DeviceSituation.DISCONNECTED:
      return { type: ApplyUpdatesStateType.DEVICE_DISCONNECTED };
    default: {
      const unhandled: never = situation;
      return unhandled;
    }
  }
};
