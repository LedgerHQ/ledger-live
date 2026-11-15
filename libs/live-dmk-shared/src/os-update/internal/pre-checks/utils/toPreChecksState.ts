import { PreChecksStateType, type PreChecksState } from "../../../api/model/PreChecksState";
import { DeviceSituation, type DeviceSituationUpdate } from "../../shared/types";

export const toPreChecksState = (
  update: DeviceSituationUpdate,
  cancel: () => void,
): PreChecksState => {
  switch (update.situation) {
    case DeviceSituation.LOCKED:
      return { type: PreChecksStateType.DEVICE_LOCKED };
    case DeviceSituation.DISCONNECTED:
      return { type: PreChecksStateType.DEVICE_DISCONNECTED };
    case DeviceSituation.CONNECTION_TIMED_OUT:
      return { type: PreChecksStateType.CONNECTION_TIMED_OUT, retry: update.retry, cancel };
    default: {
      const unhandled: never = update;
      return unhandled;
    }
  }
};
