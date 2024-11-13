import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Switch } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { setMevProtection } from "~/actions/settings";
import { mevProtectionSelector } from "~/reducers/settings";
import Track from "~/analytics/Track";
import { track } from "~/analytics";

const MevProtectionRow = () => {
  const { t } = useTranslation();
  const mevProctection = useSelector(mevProtectionSelector);

  const dispatch = useDispatch();

  const toggleMevProtection = useCallback(
    (value: boolean) => {
      dispatch(setMevProtection(value));

      track(
        "toggle_clicked",
        {
          toggleAction: value ? "ON" : "OFF",
          toggle: "MEV",
          page: "Page Settings General",
        },
        true,
      );
    },
    [dispatch],
  );

  return (
    <>
      <Track event={mevProctection ? "mev_activated" : "mev_disactivated"} onUpdate />
      <SettingsRow
        event="MevProtectionRow"
        title={t("settings.display.mevProtection")}
        desc={t("settings.display.mevProtectionDesc")}
      >
        <Switch checked={mevProctection} onChange={() => toggleMevProtection(!mevProctection)} />
      </SettingsRow>
    </>
  );
};

export default MevProtectionRow;
