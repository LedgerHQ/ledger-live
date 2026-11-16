import { OsUpdateButton } from "../../../analytics/analyticsTypes";
import { trackedAction } from "./trackedAction";
import type { OsUpdateSheet } from "../../../types/OsUpdateSheet";
import type { TrackClick } from "../../../types/TrackClick";

export function connectionTimedOutSheet(
  { retry, cancel }: Readonly<{ retry: () => void; cancel: () => void }>,
  trackClick: TrackClick,
): OsUpdateSheet {
  return {
    type: "connectionTimedOut",
    onRestart: trackedAction(trackClick, OsUpdateButton.RESTART_OS_UPDATE, retry),
    onCancel: trackedAction(trackClick, OsUpdateButton.CANCEL_OS_UPDATE, cancel),
  };
}

export function unexpectedErrorSheet(cancel: () => void, trackClick: TrackClick): OsUpdateSheet {
  return {
    type: "unexpectedError",
    onCancel: trackedAction(trackClick, OsUpdateButton.CANCEL_OS_UPDATE, cancel),
  };
}

export function secureConnectionRefusedSheet(
  { retry, cancel }: Readonly<{ retry: () => void; cancel: () => void }>,
  trackClick: TrackClick,
): OsUpdateSheet {
  return {
    type: "secureConnectionRefused",
    onRetry: trackedAction(trackClick, OsUpdateButton.RETRY_SECURE_CONNECTION, retry),
    onCancel: trackedAction(trackClick, OsUpdateButton.CANCEL_SECURE_CONNECTION, cancel),
  };
}
