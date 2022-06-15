import React, { useCallback } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import { notificationsSelector } from "../../../reducers/settings";
import { setNotifications } from "../../../actions/settings";

import SettingsRow from "../../../components/SettingsRow";
import Switch from "../../../components/Switch";
import Track from "../../../analytics/Track";

type Props = {
  style: StyleProp<ViewStyle>;
};

function MarketRow({ style }: Props) {
  const dispatch = useDispatch();
  const notifications = useSelector(notificationsSelector);

  const { t } = useTranslation();

  const onValueChange = useCallback(() => {
    dispatch(
      setNotifications({ ...notifications, market: !notifications.market }),
    );
  }, [dispatch, notifications]);

  return (
    <SettingsRow
      event="MarketRow"
      title={t("settings.notifications.market.title")}
      desc={t("settings.notifications.market.desc")}
      style={style}
    >
      <Track
        event={
          notifications.market
            ? "EnableMarketNotifications"
            : "DisableMarketNotifications"
        }
        onUpdate
      />
      <Switch
        disabled={!notifications.allowed}
        value={notifications.market}
        onValueChange={onValueChange}
      />
    </SettingsRow>
  );
}

export default MarketRow;
