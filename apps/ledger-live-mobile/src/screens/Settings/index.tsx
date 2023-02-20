import React, { useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { View, TouchableWithoutFeedback } from "react-native";
import { Icons } from "@ledgerhq/native-ui";
import { FeatureToggle } from "@ledgerhq/live-common/featureFlags/index";
import Config from "react-native-config";
import { ScreenName } from "../../const";
import { hasNoAccountsSelector } from "../../reducers/accounts";
import SettingsCard from "../../components/SettingsCard";
import PoweredByLedger from "./PoweredByLedger";
import { TrackScreen } from "../../analytics";
import timer from "../../timer";
import SettingsNavigationScrollView from "./SettingsNavigationScrollView";
import useRatings from "../../logic/ratings";
import { SettingsNavigatorStackParamList } from "../../components/RootNavigator/types/SettingsNavigator";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import { openDebugMenu } from "../../actions/appstate";
import { isDebugMenuVisible } from "../../reducers/appstate";

export default function Settings({
  navigation,
}: StackNavigatorProps<
  SettingsNavigatorStackParamList,
  ScreenName.SettingsScreen
>) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const hasNoAccounts = useSelector(hasNoAccountsSelector);
  const { handleSettingsRateApp } = useRatings();

  const debugVisible =
    useSelector(isDebugMenuVisible) || Config.FORCE_DEBUG_VISIBLE;
  const count = useRef(0);
  const debugTimeout = useRef(onTimeout);

  function onTimeout(): void {
    timer.timeout(() => {
      count.current = 0;
    }, 2000);
  }

  const onDebugHiddenPress = useCallback(() => {
    if (debugTimeout) debugTimeout.current();
    count.current++;
    if (count.current > 6) {
      count.current = 0;
      dispatch(openDebugMenu());
    } else {
      onTimeout();
    }
  }, [dispatch]);

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
      {hasNoAccounts ? null : (
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
      <FeatureToggle feature="brazePushNotifications">
        <SettingsCard
          title={t("settings.notifications.title")}
          desc={t("settings.notifications.desc")}
          Icon={Icons.NotificationsMedium}
          onClick={() => navigation.navigate(ScreenName.NotificationsSettings)}
          arrowRight
        />
      </FeatureToggle>
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
      <FeatureToggle feature="ratingsPrompt">
        <SettingsCard
          title={t("settings.about.liveReview.title")}
          desc={t("settings.about.liveReview.desc")}
          Icon={Icons.StarMedium}
          onClick={handleSettingsRateApp}
        />
      </FeatureToggle>
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
