import { useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import { lastSeenDeviceSelector, hasOnboardedDeviceSelector } from "~/renderer/reducers/settings";
import useBuyDeviceDialog from "LLD/features/BuyDevice/hooks/useBuyDeviceDialog";
import { useTranslation } from "react-i18next";
import { getDeviceIcon, type DeviceIconComponent } from "LLD/utils/getDeviceIcon";
import { MANAGER_PATH, MANAGER_TRACK_ENTRY } from "../utils/constants";
import { setOriginFlow } from "~/renderer/reducers/originFlow";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";

export const useMyLedger = (): {
  handleMyLedger: () => void;
  tooltip: string;
  icon: DeviceIconComponent;
} => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);
  const { handleOpen: openBuyDeviceModal } = useBuyDeviceDialog();
  const icon = useMemo(() => getDeviceIcon(lastSeenDevice?.modelId), [lastSeenDevice?.modelId]);

  const handleMyLedger = useCallback(() => {
    if (location.pathname !== MANAGER_PATH) {
      dispatch(setOriginFlow(HOOKS_TRACKING_LOCATIONS.managerDashboard));
      setTrackingSource("topbar");
      if (hasOnboardedDevice) {
        navigate(MANAGER_PATH);
      } else {
        openBuyDeviceModal();
      }
    }

    track("button_clicked", {
      entry: MANAGER_TRACK_ENTRY,
      page: location.pathname,
    });
  }, [dispatch, hasOnboardedDevice, location.pathname, navigate, openBuyDeviceModal]);

  return {
    handleMyLedger,
    tooltip: t("topBar.myLedger.tooltip"),
    icon,
  };
};
