import { useCallback } from "react";
import { useOsUpdateTracking } from "../../../hooks/OsUpdateTrackingProvider";
import { OsUpdateButton } from "../../../analytics/analyticsTypes";
import { useOsUpdatePorts } from "../../../hooks/OsUpdatePortsProvider";

export function useUnexpectedErrorContentViewModel() {
  const { openSupport } = useOsUpdatePorts();
  const { trackClick } = useOsUpdateTracking();
  const onPressSupport = useCallback(() => {
    trackClick(OsUpdateButton.LEDGER_SUPPORT);
    openSupport();
  }, [trackClick, openSupport]);

  return { onPressSupport };
}
