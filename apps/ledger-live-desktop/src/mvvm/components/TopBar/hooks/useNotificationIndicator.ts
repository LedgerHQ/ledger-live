import { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Bell, BellNotification } from "@ledgerhq/lumen-ui-react/symbols";
import { openInformationCenter } from "~/renderer/actions/UI";
import { track } from "~/renderer/analytics/segment";
import { useUnseenNotificationsCount } from "~/renderer/hooks/useUnseenNotificationsCount";
import { getEnv } from "@ledgerhq/live-env";

export const useNotificationIndicator = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const unseenCount = useUnseenNotificationsCount();
  const totalNotifCount = getEnv("PLAYWRIGHT_RUN") ? 0 : unseenCount;
  const hasUnseen = totalNotifCount > 0;
  const icon = hasUnseen ? BellNotification : Bell;

  const handleOpenNotificationCenter = useCallback(() => {
    track("button_clicked2", {
      button: "Notification Center",
      page: location.pathname,
    });
    dispatch(openInformationCenter(undefined));
  }, [dispatch, location.pathname]);

  return {
    tooltip: t("topBar.notificationIndicator.tooltip"),
    onClick: handleOpenNotificationCenter,
    icon,
    isInteractive: true,
    totalNotifCount,
  };
};
