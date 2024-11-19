import React, { useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import { Alert, Button, Text, Switch } from "@ledgerhq/native-ui";
import { GraphGrowAltMedium } from "@ledgerhq/native-ui/assets/icons";
import { View } from "react-native";
import SettingsRow from "~/components/SettingsRow";
import { setAnalytics } from "~/actions/settings";
import { analyticsEnabledSelector } from "~/reducers/settings";
import Track from "~/analytics/Track";
import QueuedDrawer from "~/components/QueuedDrawer";
import { FeatureToggle, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { track, updateIdentify } from "~/analytics";

const AnalyticsRow = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isOpened, setIsOpened] = useState(false);
  const analyticsEnabled = useSelector(analyticsEnabledSelector);
  const llmAnalyticsOptInPromptFeature = useFeature("llmAnalyticsOptInPrompt");

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

  const toggleAnalytics = useCallback(
    (value: boolean) => {
      dispatch(setAnalytics(value));
      updateIdentify(undefined, true);
      if (llmAnalyticsOptInPromptFeature?.enabled) {
        track(
          "toggle_clicked",
          {
            enabled: value,
            toggle: "Analytics",
            page: "Page Settings General",
          },
          true,
        );
      }
    },
    [dispatch, llmAnalyticsOptInPromptFeature?.enabled],
  );

  return (
    <>
      <Track event={analyticsEnabled ? "EnableAnalytics" : "DisableAnalytics"} onUpdate />
      <SettingsRow
        event="AnalyticsRow"
        title={t("settings.display.analytics")}
        desc={t("settings.display.analyticsDesc")}
        onHelpPress={llmAnalyticsOptInPromptFeature?.enabled ? undefined : () => setIsOpened(true)}
      >
        <Switch checked={analyticsEnabled} onChange={toggleAnalytics} />
      </SettingsRow>
      <FeatureToggle featureId="llmAnalyticsOptInPrompt">
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
      </FeatureToggle>
    </>
  );
};

export default AnalyticsRow;
