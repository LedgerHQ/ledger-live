import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import { Alert, Button, Text, Switch } from "@ledgerhq/native-ui";
import { GraphGrowAltMedium } from "@ledgerhq/native-ui/assets/icons";
import { View } from "react-native";
import SettingsRow from "../../../components/SettingsRow";
import { setAnalytics } from "../../../actions/settings";
import { analyticsEnabledSelector } from "../../../reducers/settings";
import Track from "../../../analytics/Track";
import QueuedDrawer from "../../../components/QueuedDrawer";

const AnalyticsRow = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isOpened, setIsOpened] = useState(false);
  const analyticsEnabled: boolean = useSelector(analyticsEnabledSelector);

  const bulletList = [
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
  ];

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
        onHelpPress={() => setIsOpened(true)}
      >
        <Switch
          checked={analyticsEnabled}
          onChange={value => dispatch(setAnalytics(value))}
        />
      </SettingsRow>
      <QueuedDrawer
        isRequestingToBeOpened={isOpened}
        onClose={() => setIsOpened(false)}
        Icon={GraphGrowAltMedium}
        iconColor={"primary.c80"}
        title={t("settings.display.analyticsModal.title")}
        description={t("settings.display.analyticsModal.desc")}
      >
        <Alert showIcon={false}>
          <View>
            {bulletList.map(item => (
              <Text
                variant={"paragraph"}
                fontWeight={"medium"}
                color={"primary.c90"}
                key={item.key}
              >
                •{"  "}
                {item.val}
              </Text>
            ))}
          </View>
        </Alert>
        <Button type={"main"} mt={8} onPress={() => setIsOpened(false)}>
          <Trans i18nKey="common.close" />
        </Button>
      </QueuedDrawer>
    </>
  );
};

export default AnalyticsRow;
