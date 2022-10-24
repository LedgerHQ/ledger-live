import React, { useMemo, useCallback } from "react";
import {
  createStackNavigator,
  TransitionPresets,
} from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { TouchableOpacity } from "react-native";
import { Box, Icons } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "../../const";
import BenchmarkQRStream from "../../screens/BenchmarkQRStream";
import DebugSwap from "../../screens/DebugSwap";
import DebugBLE from "../../screens/DebugBLE";
import DebugBLEBenchmark from "../../screens/DebugBLEBenchmark";
import DebugCrash from "../../screens/DebugCrash";
import DebugHttpTransport from "../../screens/DebugHttpTransport";
import DebugFeatureFlags from "../../screens/FeatureFlagsSettings";
import DebugIcons from "../../screens/DebugIcons";
import DebugLottie from "../../screens/DebugLottie";
import DebugMultiAppInstall from "../../screens/DebugMultiAppInstall";
import DebugLogs from "../../screens/DebugLogs";
import DebugStore from "../../screens/DebugStore";
import DebugEnv from "../../screens/DebugEnv";
import DebugPlayground from "../../screens/DebugPlayground";
import Settings from "../../screens/Settings";
import AccountsSettings from "../../screens/Settings/Accounts";
import AboutSettings from "../../screens/Settings/About";
import Resources from "../../screens/Settings/Resources";
import GeneralSettings from "../../screens/Settings/General";
import CountervalueSettings from "../../screens/Settings/General/CountervalueSettings";
import NotificationsSettings from "../../screens/Settings/Notifications";
import HelpSettings from "../../screens/Settings/Help";
import RegionSettings from "../../screens/Settings/General/Region";
import CurrenciesList from "../../screens/Settings/CryptoAssets/Currencies/CurrenciesList";
import CurrencySettings from "../../screens/Settings/CryptoAssets/Currencies/CurrencySettings";
import DebugSettings, {
  DebugDevices,
  DebugMocks,
} from "../../screens/Settings/Debug";
import DebugExport from "../../screens/Settings/Debug/ExportAccounts";
import ExperimentalSettings from "../../screens/Settings/Experimental";
import DeveloperSettings, {
  DeveloperCustomManifest,
} from "../../screens/Settings/Developer";
import RepairDevice from "../../screens/RepairDevice";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import Button from "../Button";
import HelpButton from "../../screens/Settings/HelpButton";
import OnboardingStepLanguage from "../../screens/Onboarding/steps/language";
import { GenerateMockAccountSelectScreen } from "../../screens/Settings/Debug/GenerateMockAccountsSelect";
import HiddenNftCollections from "../../screens/Settings/Accounts/HiddenNftCollections";
import { track } from "../../analytics";
import { useNoNanoBuyNanoWallScreenOptions } from "../../context/NoNanoBuyNanoWall";
import PostOnboardingDebugScreen from "../../screens/PostOnboarding/PostOnboardingDebugScreen";
import { SettingsNavigatorStackParamList } from "./types/SettingsNavigator";

const Stack = createStackNavigator<SettingsNavigatorStackParamList>();

export default function SettingsNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavConfig = useMemo(
    () => getStackNavigatorConfig(colors),
    [colors],
  );

  const navigation = useNavigation();
  const noNanoBuyNanoWallScreenOptions = useNoNanoBuyNanoWallScreenOptions();

  const goBackFromNotifications = useCallback(() => {
    track("button_clicked", {
      button: "Back Arrow",
    });
    navigation.goBack();
  }, [navigation]);

  return (
    <Stack.Navigator screenOptions={stackNavConfig}>
      <Stack.Screen
        name={ScreenName.SettingsScreen}
        component={Settings}
        options={{
          title: t("settings.header"),
          headerRight: () => <HelpButton />,
        }}
      />
      <Stack.Screen
        name={ScreenName.CountervalueSettings}
        component={CountervalueSettings}
        options={{
          title: t("settings.display.counterValue"),
        }}
      />
      <Stack.Screen
        name={ScreenName.RegionSettings}
        component={RegionSettings}
        options={{
          title: t("settings.display.region"),
        }}
      />
      <Stack.Screen
        name={ScreenName.GeneralSettings}
        component={GeneralSettings}
        options={{
          title: t("settings.display.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.AccountsSettings}
        component={AccountsSettings}
        options={{
          title: t("settings.accounts.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.AboutSettings}
        component={AboutSettings}
        options={{
          title: t("settings.about.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.NotificationsSettings}
        component={NotificationsSettings}
        options={{
          headerLeft: () => (
            <Box ml={6}>
              <TouchableOpacity onPress={goBackFromNotifications}>
                <Icons.ArrowLeftMedium size={24} />
              </TouchableOpacity>
            </Box>
          ),
          title: t("settings.notifications.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.HelpSettings}
        component={HelpSettings}
        options={{
          title: t("settings.help.header"),
        }}
      />
      <Stack.Screen
        name={ScreenName.Resources}
        component={Resources}
        options={{ title: t("settings.resources") }}
      />
      <Stack.Screen
        name={ScreenName.CryptoAssetsSettings}
        component={CurrenciesList}
        options={{ title: t("settings.accounts.cryptoAssets.header") }}
      />
      <Stack.Screen
        name={ScreenName.HiddenNftCollections}
        component={HiddenNftCollections}
        options={{ title: t("settings.accounts.hiddenNFTCollections") }}
      />
      <Stack.Screen
        name={ScreenName.CurrencySettings}
        component={CurrencySettings}
        options={({ route }) => ({
          title: route.params?.headerTitle,
          headerRight: undefined,
        })}
        {...noNanoBuyNanoWallScreenOptions}
      />
      <Stack.Screen
        name={ScreenName.RepairDevice}
        component={RepairDevice}
        options={{
          title: t("RepairDevice.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.ExperimentalSettings}
        component={ExperimentalSettings}
        options={{
          title: t("settings.experimental.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.DeveloperSettings}
        component={DeveloperSettings}
        options={{
          title: t("settings.developer.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.DeveloperCustomManifest}
        component={DeveloperCustomManifest}
        options={{
          title: t("settings.developer.customManifest.title"),
          headerTitleStyle: {
            width: "80%",
          },
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugSettings}
        component={DebugSettings}
        options={{
          title: "Debug",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugDevices}
        component={DebugDevices}
        options={{
          title: "Debug Devices",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugFeatureFlags}
        component={DebugFeatureFlags}
        options={{
          title: "Debug Feature Flags",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugMocks}
        component={DebugMocks}
        options={{
          title: "Mock & Test",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugMockGenerateAccounts}
        component={GenerateMockAccountSelectScreen}
        options={{
          title: "Generate mock accounts",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugExport}
        component={DebugExport}
        options={{
          title: "Export Accounts",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugSwap}
        component={DebugSwap}
        options={{
          title: "Debug Swap",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugBLE}
        component={DebugBLE}
        options={({ route, navigation }) => ({
          title: "Debug BLE",
          headerRight: () => (
            <Button
              event="DebugBLEBenchmark"
              type="lightSecondary"
              containerStyle={{ width: 100 }}
              onPress={() =>
                navigation.navigate(ScreenName.DebugBLEBenchmark, {
                  deviceId: route.params?.deviceId,
                })
              }
              title="Benchmark"
            />
          ),
        })}
      />
      <Stack.Screen
        name={ScreenName.DebugBLEBenchmark}
        component={DebugBLEBenchmark}
        options={{
          title: "Debug BLE Benchmark",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugCrash}
        component={DebugCrash}
        options={{
          title: "Debug Crash",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugStore}
        component={DebugStore}
        options={{
          title: "Debug Store",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugEnv}
        component={DebugEnv}
        options={{
          title: "Debug Env",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugHttpTransport}
        component={DebugHttpTransport}
        options={{
          title: "Debug Http Transport",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugLogs}
        component={DebugLogs}
        options={{
          title: "Debug Logs",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugIcons}
        component={DebugIcons}
        options={{
          title: "Debug Icons",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugLottie}
        component={DebugLottie}
        options={{
          title: "Debug Lottie",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugMultiAppInstall}
        component={DebugMultiAppInstall}
        options={{
          title: "Debug MultiAppInstall",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugPlayground}
        component={DebugPlayground}
        options={{
          title: "Playground for testing",
        }}
      />
      <Stack.Screen
        name={ScreenName.BenchmarkQRStream}
        component={BenchmarkQRStream}
        options={{
          title: "Benchmark QRStream",
        }}
      />
      <Stack.Screen
        name={ScreenName.OnboardingLanguage}
        component={OnboardingStepLanguage}
        options={{
          ...TransitionPresets.ModalTransition,
          headerShown: true,
          headerTitle: t("onboarding.stepLanguage.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.PostOnboardingDebugScreen}
        component={PostOnboardingDebugScreen}
      />
    </Stack.Navigator>
  );
}
