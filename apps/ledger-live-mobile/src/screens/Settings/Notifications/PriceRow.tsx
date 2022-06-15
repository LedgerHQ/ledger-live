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

function PriceRow({ style }: Props) {
  const dispatch = useDispatch();
  const notifications = useSelector(notificationsSelector);

  const { t } = useTranslation();

  const onValueChange = useCallback(() => {
    dispatch(
      setNotifications({ ...notifications, price: !notifications.price }),
    );
  }, [dispatch, notifications]);

  return (
    <SettingsRow
      event="PriceRow"
      title={t("settings.notifications.price.title")}
      desc={t("settings.notifications.price.desc")}
      label={t("settings.notifications.price.label")}
      style={style}
    >
      <Track
        event={
          notifications.price
            ? "EnableTransactionNotifications"
            : "DisableTransactionNotifications"
        }
        onUpdate
      />
      <Switch
        disabled={!notifications.allowed}
        value={notifications.price}
        onValueChange={onValueChange}
      />
    </SettingsRow>
  );
}

export default PriceRow;
