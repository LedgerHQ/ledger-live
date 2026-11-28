import { PreChecksStateType, type PreChecksState } from "@features/platform-device-os-update";
import { OsUpdateButton } from "../../../../analytics/analyticsTypes";
import { connectionTimedOutSheet, unexpectedErrorSheet } from "../sheets";
import { trackedAction } from "../trackedAction";
import type { OsUpdateSheet } from "../../../../types/OsUpdateSheet";
import type { OsUpdateStepDescriptor } from "../../../../types/OsUpdateStepDescriptor";
import type { TrackClick } from "../../../../types/TrackClick";

function getSheet(state: PreChecksState, trackClick: TrackClick): OsUpdateSheet | undefined {
  switch (state.type) {
    case PreChecksStateType.LOADING:
      return undefined;
    case PreChecksStateType.DEVICE_LOCKED:
      return { type: "deviceLocked" };
    case PreChecksStateType.DEVICE_DISCONNECTED:
      return { type: "deviceDisconnected" };
    case PreChecksStateType.CONNECTION_TIMED_OUT:
      return connectionTimedOutSheet(state, trackClick);
    case PreChecksStateType.BATTERY_TOO_LOW:
      return {
        type: "batteryTooLow",
        percentage: state.currentPercentage,
        onCancel: trackedAction(trackClick, OsUpdateButton.CANCEL_OS_UPDATE, state.cancel),
      };
    case PreChecksStateType.UNEXPECTED_ERROR:
      return unexpectedErrorSheet(state.cancel, trackClick);
    default: {
      const unhandled: never = state;
      return unhandled;
    }
  }
}

export function resolvePreChecksStep(
  state: PreChecksState,
  trackClick: TrackClick,
): OsUpdateStepDescriptor {
  return { screen: { type: "preparing" }, sheet: getSheet(state, trackClick) };
}
