import React, { useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { View, TouchableWithoutFeedback } from "react-native";
import { Icons } from "@ledgerhq/native-ui";
import { FeatureToggle } from "@ledgerhq/live-common/featureFlags/index";
import Config from "react-native-config";
import { ScreenName } from "../../const";
import { accountsSelector } from "../../reducers/accounts";
import { languageSelector } from "../../reducers/settings";
import SettingsCard from "../../components/SettingsCard";
import PoweredByLedger from "./PoweredByLedger";
import TrackScreen from "../../analytics/TrackScreen";
import timer from "../../timer";
import SettingsNavigationScrollView from "./SettingsNavigationScrollView";
import useRatings from "../../logic/ratings";

type Props = {
  navigation: any;
};

export default function Settings({ navigation }: Props) {
  const { t } = useTranslation();
  const accounts = useSelector(accountsSelector);
  const { handleSettingsRateApp } = useRatings();
  const currAppLanguage = useSelector(languageSelector);

  const [debugVisible, setDebugVisible] = useState(
    Config.FORCE_DEBUG_VISIBLE || false,
  );
  const count = useRef(0);
  const debugTimeout = useRef(onTimeout);

  function onTimeout(): void {
    timer.timeout(() => {
      count.current = 0;
    }, 1000);
  }

  const onDebugHiddenPress = useCallback(() => {
    if (debugTimeout) debugTimeout.current();
    count.current++;
    if (count.current > 6) {
      count.current = 0;
      setDebugVisible(!debugVisible);
    } else {
      onTimeout();
    }
  }, [debugVisible]);

  return (
    <SettingsNavigationScrollView>
      <TrackScreen category="Settings" />
      <SettingsCard
        title={t("settings.display.title")}
        desc={t("settings.display.desc")}
        Icon={Icons.MobileMedium}
        onClick={() => navigation.navigate(ScreenName.GeneralSettings)}
        arrowRight
        settingsCardTestId="general-settings-card"
      />
      {accounts.length > 0 && (
        <SettingsCard
          title={t("settings.accounts.title")}
          desc={t("settings.accounts.desc")}
          Icon={Icons.WalletMedium}
          onClick={() => navigation.navigate(ScreenName.AccountsSettings)}
          arrowRight
        />
      )}
      <SettingsCard
        title={t("settings.about.title")}
        desc={t("settings.about.desc")}
        Icon={Icons.BracketsMedium}
        onClick={() => navigation.navigate(ScreenName.AboutSettings)}
        arrowRight
      />
      <SettingsCard
        title={t("settings.help.title")}
        desc={t("settings.help.desc")}
        Icon={Icons.LifeRingMedium}
        onClick={() => navigation.navigate(ScreenName.HelpSettings)}
        arrowRight
      />
      <SettingsCard
        title={t("settings.experimental.title")}
        desc={t("settings.experimental.desc")}
        Icon={Icons.ChartNetworkMedium}
        onClick={() => navigation.navigate(ScreenName.ExperimentalSettings)}
        arrowRight
      />
      {currAppLanguage === "en" ? (
        <FeatureToggle feature="ratings">
          <SettingsCard
            title={t("settings.about.liveReview.title")}
            desc={t("settings.about.liveReview.desc")}
            Icon={Icons.StarMedium}
            onClick={handleSettingsRateApp}
          />
        </FeatureToggle>
      ) : null}
      <SettingsCard
        title={t("settings.developer.title")}
        desc={t("settings.developer.desc")}
        Icon={Icons.ToolMedium}
        onClick={() => navigation.navigate(ScreenName.DeveloperSettings)}
      />
      {debugVisible || __DEV__ ? (
        <SettingsCard
          title="Debug"
          desc="Use at your own risk – Developer tools"
          Icon={Icons.ToolsMedium}
          onClick={() => navigation.navigate(ScreenName.DebugSettings)}
          arrowRight
        />
      ) : null}
      <TouchableWithoutFeedback onPress={onDebugHiddenPress}>
        <View>
          <PoweredByLedger />
        </View>
      </TouchableWithoutFeedback>
    </SettingsNavigationScrollView>
  );
}
