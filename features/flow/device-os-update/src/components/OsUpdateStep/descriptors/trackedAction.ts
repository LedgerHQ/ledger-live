import type { OsUpdateButton } from "../../../analytics/analyticsTypes";
import type { TrackClick } from "../../../types/TrackClick";

/** An action of a sheet, tracked as a click on its button. */
export function trackedAction(
  trackClick: TrackClick,
  button: OsUpdateButton,
  action: () => void,
): () => void {
  return () => {
    trackClick(button);
    action();
  };
}
