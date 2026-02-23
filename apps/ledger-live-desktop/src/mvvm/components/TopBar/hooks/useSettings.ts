import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Settings } from "@ledgerhq/lumen-ui-react/symbols";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";

export const useSettings = (): {
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
      setTrackingSource("topbar");
      navigate(url);
    }
  }, [navigate, location]);

  return {
    handleSettings,
    settingsIcon: Settings,
    tooltip: t("settings.title"),
  };
};
