import { PreChecksStateType, type PreChecksState } from "../../../api/model/PreChecksState";
import { DeviceSituation } from "../../shared/types";

export const toPreChecksState = (situation: DeviceSituation): PreChecksState => {
  switch (situation) {
    case DeviceSituation.LOCKED:
      return { type: PreChecksStateType.DEVICE_LOCKED };
    case DeviceSituation.DISCONNECTED:
      return { type: PreChecksStateType.DEVICE_DISCONNECTED };
    default: {
      const unhandled: never = situation;
      return unhandled;
    }
  }
};
