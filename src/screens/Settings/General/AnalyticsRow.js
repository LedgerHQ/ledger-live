/* @flow */
import React, { useState } from "react";
import FeatherIcon from "react-native-vector-icons/dist/Feather";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import SettingsRow from "../../../components/SettingsRow";
import { setAnalytics } from "../../../actions/settings";
import { analyticsEnabledSelector } from "../../../reducers/settings";
import InfoModal from "../../../components/InfoModal";
import Track from "../../../analytics/Track";
import Switch from "../../../components/Switch";

const IconActivity = () => {
  const { colors } = useTheme();
  return <FeatherIcon name="activity" size={32} color={colors.live} />;
};

const AnalyticsRow = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [isOpened, setIsOpened] = useState(false);

  const analyticsEnabled = useSelector(analyticsEnabledSelector);

  return (
    <>
      <Track
        event={analyticsEnabled ? "EnableAnalytics" : "DisableAnalytics"}
        mandatory
        onUpdate
      />
      <SettingsRow
        event="AnalyticsRow"
        title={t("settings.display.analytics")}
        desc={t("settings.display.analyticsDesc")}
        onPress={null}
        onHelpPress={() => setIsOpened(true)}
        alignedTop
      >
        <Switch
          style={{ opacity: 0.99 }}
          value={analyticsEnabled}
          onValueChange={value => dispatch(setAnalytics(value))}
        />
      </SettingsRow>
      <InfoModal
        id="AnalyticsModal"
        Icon={IconActivity}
        isOpened={isOpened}
        onClose={() => setIsOpened(false)}
        title={t("settings.display.analyticsModal.title")}
        desc={t("settings.display.analyticsModal.desc")}
        bullets={[
          {
            key: "bullet0",
            val: t("settings.display.analyticsModal.bullet0"),
          },
          {
            key: "bullet1",
            val: t("settings.display.analyticsModal.bullet1"),
          },
          {
            key: "bullet2",
            val: t("settings.display.analyticsModal.bullet2"),
          },
          {
            key: "bullet3",
            val: t("settings.display.analyticsModal.bullet3"),
          },
          {
            key: "bullet4",
            val: t("settings.display.analyticsModal.bullet4"),
          },
          {
            key: "bullet5",
            val: t("settings.display.analyticsModal.bullet5"),
          },
          {
            key: "bullet6",
            val: t("settings.display.analyticsModal.bullet6"),
          },
          {
            key: "bullet7",
            val: t("settings.display.analyticsModal.bullet7"),
          },
          {
            key: "bullet8",
            val: t("settings.display.analyticsModal.bullet8"),
          },
        ]}
      />
    </>
  );
};

export default AnalyticsRow;
