import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import SettingsRow from "../../../components/SettingsRow";
import Switch from "../../../components/Switch";
import Track from "../../../analytics/Track";

type Props = {
  allEnabled: boolean;
  toggleAll: (enable: boolean) => void;
};

function AllowNotificationsRow({ allEnabled, toggleAll }: Props) {
  const [enabled, setEnabled] = useState(false);

  const { t } = useTranslation();

  const onValueChange = (allowed: boolean) => {
    if (!allowed) {
      setEnabled(false);
    } else {
      setEnabled(true);
      // TODO : Prompt if notifs not yet allowed on OS
    }
    toggleAll(!allEnabled);
  };

  return (
    <SettingsRow
      event="AllowNotificationsRow"
      title={t("settings.notifications.allowNotifications.title")}
      desc={t("settings.notifications.allowNotifications.desc")}
    >
      <Track
        event={enabled ? "EnableNotifications" : "DisableNotifications"}
        onUpdate
      />
      <Switch value={enabled} onValueChange={() => onValueChange(!enabled)} />
    </SettingsRow>
  );
}

export default AllowNotificationsRow;
