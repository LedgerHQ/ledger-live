import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Clock } from "@ledgerhq/lumen-ui-react/symbols";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { track } from "~/renderer/analytics/segment";
import { useSelector } from "LLD/hooks/redux";
import { hasUnreadOperationsSelector } from "~/renderer/reducers/history";

export const useHistory = (): {
  handleHistory: () => void;
  historyIcon: typeof Clock;
  hasUnread: boolean;
  cta: string;
} => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const hasUnread = useSelector(hasUnreadOperationsSelector);

  const handleHistory = useCallback(() => {
    const url = "/history";
    if (location.pathname !== url) {
      setTrackingSource("topbar");
      track("button_clicked", {
        entry: "operation_list",
        page: location.pathname,
      });
      navigate(url);
    }
  }, [navigate, location.pathname]);

  return {
    handleHistory,
    historyIcon: Clock,
    hasUnread,
    cta: t("topBar.history.cta"),
  };
};
