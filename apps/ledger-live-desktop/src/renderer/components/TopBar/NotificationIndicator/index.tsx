import Tooltip from "~/renderer/components/Tooltip";
import React, { useCallback } from "react";
import { ItemContainer } from "../shared";
import IconBell from "~/renderer/icons/Bell";
import { useTranslation } from "react-i18next";
import { InformationDrawer } from "./InformationDrawer";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useLocation } from "react-router";
import { informationCenterStateSelector } from "~/renderer/reducers/UI";
import { openInformationCenter, closeInformationCenter } from "~/renderer/actions/UI";
import { track } from "~/renderer/analytics/segment";
import { useUnseenNotificationsCount } from "~/renderer/hooks/useUnseenNotificationsCount";
import { getEnv } from "@ledgerhq/live-env";

export function NotificationIndicator() {
  const { t } = useTranslation();

  const unseenCount = useUnseenNotificationsCount();
  const totalNotifCount = getEnv("PLAYWRIGHT_RUN") ? 0 : unseenCount;

  const { isOpen } = useSelector(informationCenterStateSelector);
  const dispatch = useDispatch();

  const location = useLocation();
  const onClickNotificationCenter = useCallback(() => {
    track("button_clicked2", {
      button: "Notification Center",
      page: location.pathname,
    });
    dispatch(openInformationCenter(undefined));
  }, [dispatch, location.pathname]);

  return (
    <>
      <InformationDrawer
        isOpen={isOpen}
        onRequestClose={() => dispatch(closeInformationCenter())}
      />
      <Tooltip content={t("informationCenter.tooltip")} placement="bottom">
        <ItemContainer
          data-testid="topbar-notification-button"
          isInteractive
          onClick={onClickNotificationCenter}
        >
          <IconBell size={18} count={totalNotifCount} />
        </ItemContainer>
      </Tooltip>
    </>
  );
}
