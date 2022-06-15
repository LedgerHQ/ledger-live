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

function TransactionsRow({ style }: Props) {
  const dispatch = useDispatch();
  const notifications = useSelector(notificationsSelector);

  const { t } = useTranslation();

  const onValueChange = useCallback(() => {
    dispatch(
      setNotifications({
        ...notifications,
        transactions: !notifications.transactions,
      }),
    );
  }, [dispatch, notifications]);

  return (
    <SettingsRow
      event="TransactionsRow"
      title={t("settings.notifications.transactions.title")}
      desc={t("settings.notifications.transactions.desc")}
      style={style}
    >
      <Track
        event={
          notifications.transactions
            ? "EnableTransactionNotifications"
            : "DisableTransactionNotifications"
        }
        onUpdate
      />
      <Switch
        disabled={!notifications.allowed}
        value={notifications.transactions}
        onValueChange={onValueChange}
      />
    </SettingsRow>
  );
}

export default TransactionsRow;
