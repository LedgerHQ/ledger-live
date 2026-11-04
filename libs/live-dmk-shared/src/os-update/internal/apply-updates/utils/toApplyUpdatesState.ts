import {
  ApplyUpdatesStateType,
  type ApplyUpdatesState,
} from "../../../api/model/ApplyUpdatesState";
import { DeviceSituation, type DeviceSituationUpdate } from "../../shared/types";

export const toApplyUpdatesState = (update: DeviceSituationUpdate): ApplyUpdatesState => {
  switch (update.situation) {
    case DeviceSituation.LOCKED:
      return { type: ApplyUpdatesStateType.DEVICE_LOCKED };
    case DeviceSituation.DISCONNECTED:
      return { type: ApplyUpdatesStateType.DEVICE_DISCONNECTED };
    case DeviceSituation.CONNECTION_TIMED_OUT:
      return { type: ApplyUpdatesStateType.CONNECTION_TIMED_OUT, retry: update.retry };
    default: {
      const unhandled: never = update;
      return unhandled;
    }
  }
};
