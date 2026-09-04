import { PreChecksStateType, type PreChecksState } from "../../../api/model/PreChecksState";

export const isSameState = (previous: PreChecksState, next: PreChecksState): boolean => {
  if (previous.type !== next.type) {
    return false;
  }
  if (
    previous.type === PreChecksStateType.BATTERY_TOO_LOW &&
    next.type === PreChecksStateType.BATTERY_TOO_LOW
  ) {
    return previous.currentPercentage === next.currentPercentage;
  }
  return true;
};
