import React, { useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import SettingsNavigationScrollView from "../SettingsNavigationScrollView";
import { TrackScreen } from "../../../analytics";

import AllowNotificationsRow from "./AllowNotificationsRow";
import TransactionsRow from "./TransactionsRow";
import MarketRow from "./MarketRow";
import AnnouncementRow from "./AnnouncementRow";
import PriceRow from "./PriceRow";

import { notificationsSelector } from "../../../reducers/settings";
import { setNotifications } from "../../../actions/settings";

function NotificationsSettings() {
  const dispatch = useDispatch();
  const notifications = useSelector(notificationsSelector);
  const style = useMemo(
    () => (notifications.allowed ? null : { opacity: 0.3, width: "100%" }),
    [notifications],
  );

  const toggleNotifications = useCallback(
    () =>
      dispatch(
        setNotifications({
          ...notifications,
          allowed: !notifications.allowed,
        }),
      ),
    [dispatch, notifications],
  );

  return (
    <SettingsNavigationScrollView>
      <TrackScreen category="Settings" name="Notifications" />
      <AllowNotificationsRow toggleAll={toggleNotifications} />
      <TransactionsRow style={style} />
      <MarketRow style={style} />
      <AnnouncementRow style={style} />
      <PriceRow style={style} />
    </SettingsNavigationScrollView>
  );
}

export default NotificationsSettings;
