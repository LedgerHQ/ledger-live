import { useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import { lastSeenDeviceSelector } from "~/renderer/reducers/settings";
import { useTranslation } from "react-i18next";
import { getDeviceIcon, type DeviceIconComponent } from "LLD/utils/getDeviceIcon";
import { MANAGER_PATH, MANAGER_TRACK_ENTRY } from "../utils/constants";

export const useMyLedger = (): {
  handleMyLedger: () => void;
  tooltip: string;
  icon: DeviceIconComponent;
} => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const icon = useMemo(() => getDeviceIcon(lastSeenDevice?.modelId), [lastSeenDevice?.modelId]);

  const handleMyLedger = useCallback(() => {
    if (location.pathname !== MANAGER_PATH) {
      setTrackingSource("topbar");
      navigate(MANAGER_PATH);
    }
    track("button_clicked", {
      entry: MANAGER_TRACK_ENTRY,
      page: location.pathname,
    });
  }, [navigate, location.pathname]);

  return {
    handleMyLedger,
    tooltip: t("topBar.myLedger.tooltip"),
    icon,
  };
};
