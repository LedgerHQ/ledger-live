import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Settings } from "@ledgerhq/lumen-ui-react/symbols";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { MY_WALLET_TRACKING_PAGE_NAME } from "LLD/features/MyWallet/constants";

export type SettingsTrackingSource = "topbar" | typeof MY_WALLET_TRACKING_PAGE_NAME;

export const useSettings = (
  source: SettingsTrackingSource = "topbar",
): {
  handleSettings: () => void;
  settingsIcon: typeof Settings;
  tooltip: string;
} => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSettings = useCallback(() => {
    const url = "/settings";
    if (location.pathname !== url) {
      setTrackingSource(source);
      navigate(url);
    }
  }, [navigate, location, source]);

  return {
    handleSettings,
    settingsIcon: Settings,
    tooltip: t("settings.title"),
  };
};
