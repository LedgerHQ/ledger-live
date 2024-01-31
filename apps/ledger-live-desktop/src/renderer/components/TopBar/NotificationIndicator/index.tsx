import Tooltip from "~/renderer/components/Tooltip";
import React, { useCallback } from "react";
import { ItemContainer } from "../shared";
import IconBell from "~/renderer/icons/Bell";
import { useTranslation } from "react-i18next";
import { InformationDrawer } from "./InformationDrawer";
import { useDispatch, useSelector } from "react-redux";
import { informationCenterStateSelector } from "~/renderer/reducers/UI";
import { openInformationCenter, closeInformationCenter } from "~/renderer/actions/UI";
import { notificationsContentCardSelector } from "~/renderer/reducers/dynamicContent";
import { track } from "~/renderer/analytics/segment";
import { useHistory } from "react-router";
import { getEnv } from "@ledgerhq/live-env";

export function NotificationIndicator() {
  const { t } = useTranslation();
  const notificationsCards = useSelector(notificationsContentCardSelector);

  const totalNotifCount = getEnv("PLAYWRIGHT_RUN")
    ? 0
    : notificationsCards?.filter(n => !n.viewed).length || 0;
  const { isOpen } = useSelector(informationCenterStateSelector);
  const dispatch = useDispatch();
  const history = useHistory();

  const onClickNotificationCenter = useCallback(() => {
    track("button_clicked2", {
      button: "Notification Center",
      page: history.location.pathname,
    });
    dispatch(openInformationCenter(undefined));
  }, [dispatch, history.location.pathname]);

  return (
    <>
      <InformationDrawer
        isOpen={isOpen}
        onRequestClose={() => dispatch(closeInformationCenter())}
      />
      <Tooltip content={t("informationCenter.tooltip")} placement="bottom">
        <ItemContainer
          data-test-id="topbar-notification-button"
          isInteractive
          onClick={onClickNotificationCenter}
        >
          <IconBell size={18} count={totalNotifCount} />
        </ItemContainer>
      </Tooltip>
    </>
  );
}
