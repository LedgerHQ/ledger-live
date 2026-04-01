import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Clock } from "@ledgerhq/lumen-ui-react/symbols";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";

export const useHistory = (): {
  handleHistory: () => void;
  historyIcon: typeof Clock;
  tooltip: string;
  cta: string;
} => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleHistory = useCallback(() => {
    const url = "/history";
    if (location.pathname !== url) {
      setTrackingSource("topbar");
      navigate(url);
    }
  }, [navigate, location.pathname]);

  return {
    handleHistory,
    historyIcon: Clock,
    tooltip: t("topBar.history.tooltip"),
    cta: t("topBar.history.cta"),
  };
};
