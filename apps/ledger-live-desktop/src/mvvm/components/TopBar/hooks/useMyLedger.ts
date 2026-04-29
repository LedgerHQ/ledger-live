import { useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import { useSelector } from "LLD/hooks/redux";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import { lastSeenDeviceSelector, hasOnboardedDeviceSelector } from "~/renderer/reducers/settings";
import useBuyDeviceDialog from "LLD/features/BuyDevice/hooks/useBuyDeviceDialog";
import { useTranslation } from "react-i18next";
import { getDeviceIcon, type DeviceIconComponent } from "LLD/utils/getDeviceIcon";
import { MANAGER_PATH, MANAGER_TRACK_ENTRY } from "../utils/constants";
import { setOriginFlow } from "~/renderer/analytics/originFlow";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { MY_WALLET_TRACKING_PAGE_NAME } from "LLD/features/MyWallet/constants";

export type MyLedgerTrackingSource = "topbar" | typeof MY_WALLET_TRACKING_PAGE_NAME;

export type UseMyLedgerOptions = {
  trackingSource?: MyLedgerTrackingSource;
  /** Segment `page` on `button_clicked` (defaults to current route pathname) */
  analyticsPage?: string;
  /** Segment `entry` for `button_clicked` (defaults to manager) */
  analyticsEntry?: string;
  /** Segment `button` on `button_clicked` */
  analyticsButton?: string;
};

export const useMyLedger = (
  options?: UseMyLedgerOptions,
): {
  handleMyLedger: () => void;
  tooltip: string;
  icon: DeviceIconComponent;
} => {
  const trackingSource = options?.trackingSource ?? "topbar";
  const analyticsPage = options?.analyticsPage;
  const analyticsEntry = options?.analyticsEntry ?? MANAGER_TRACK_ENTRY;
  const analyticsButton = options?.analyticsButton ?? "my ledger";
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);
  const { handleOpen: openBuyDeviceModal } = useBuyDeviceDialog();
  const icon = useMemo(() => getDeviceIcon(lastSeenDevice?.modelId), [lastSeenDevice?.modelId]);

  const handleMyLedger = useCallback(() => {
    if (location.pathname !== MANAGER_PATH) {
      setOriginFlow(HOOKS_TRACKING_LOCATIONS.managerDashboard);
      setTrackingSource(trackingSource);
      if (hasOnboardedDevice) {
        navigate(MANAGER_PATH);
      } else {
        openBuyDeviceModal();
      }
    }

    track("button_clicked", {
      button: analyticsButton,
      page: analyticsPage ?? location.pathname,
      entry: analyticsEntry,
    });
  }, [
    analyticsButton,
    analyticsEntry,
    analyticsPage,
    hasOnboardedDevice,
    location.pathname,
    navigate,
    openBuyDeviceModal,
    trackingSource,
  ]);

  return {
    handleMyLedger,
    tooltip: t("topBar.myLedger.tooltip"),
    icon,
  };
};
