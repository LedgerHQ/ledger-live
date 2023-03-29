import React, { useMemo } from "react";
import {
  createStackNavigator,
  TransitionPresets,
} from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { ScreenName } from "../../const";

import DebugBenchmarkQRStream from "../../screens/Settings/Debug/Broken/BenchmarkQRStream";
import DebugBLE from "../../screens/Settings/Debug/Connectivity/BLE";
import DebugBLEBenchmark from "../../screens/Settings/Debug/Connectivity/BLEBenchmark";
import DebugConfiguration from "../../screens/Settings/Debug/Configuration";
import DebugConnectivity from "../../screens/Settings/Debug/Connectivity";
import DebugCrash from "../../screens/Settings/Debug/Debugging/Crashes";
import DebugCustomImageGraphics from "../../screens/Settings/Debug/Features/CustomImageGraphics";
import DebugDebugging from "../../screens/Settings/Debug/Debugging";
import DebugEnv from "../../screens/Settings/Debug/Configuration/DebugEnv";
import DebugExport from "../../screens/Settings/Debug/Features/ExportAccounts";
import DebugFeatureFlags from "../../screens/FeatureFlagsSettings";
import DebugFeatures from "../../screens/Settings/Debug/Features";
import DebugFetchCustomImage from "../../screens/Settings/Debug/Features/FetchCustomImage";
import DebugFirmwareUpdate from "../../screens/Settings/Debug/Features/FirmwareUpdate";
import DebugGenerators from "../../screens/Settings/Debug/Generators";
import DebugHttpTransport from "../../screens/Settings/Debug/Connectivity/DebugHttpTransport";
import DebugInformation from "../../screens/Settings/Debug/Information";
import DebugInstallSetOfApps from "../../screens/Settings/Debug/Features/InstallSetOfApps";
import DebugPerformance from "../../screens/Settings/Debug/Performance";
import DebugLogs from "../../screens/Settings/Debug/Debugging/Logs";
import DebugLottie from "../../screens/Settings/Debug/Features/Lottie";
import DebugNetwork from "../../screens/Settings/Debug/Debugging/Network";
import DebugCommandSender from "../../screens/Settings/Debug/Connectivity/CommandSender";
import DebugPlayground from "../../screens/Settings/Debug/Playground";
import DebugBluetoothAndLocationServices from "../../screens/Settings/Debug/Debugging/BluetoothAndLocationServices";
import DebugSettings from "../../screens/Settings/Debug";
import DebugStore from "../../screens/Settings/Debug/Debugging/Store";
import DebugStoryly from "../../screens/Settings/Debug/Features/Storyly";
import DebugSwap from "../../screens/Settings/Debug/Features/Swap";
import DebugVideos from "../../screens/Settings/Debug/Features/Videos";

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
import ExperimentalSettings from "../../screens/Settings/Experimental";
import DeveloperSettings, {
  DeveloperCustomManifest,
} from "../../screens/Settings/Developer";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import Button from "../Button";
import HelpButton from "../../screens/Settings/HelpButton";
import OnboardingStepLanguage from "../../screens/Onboarding/steps/language";
import { GenerateMockAccountSelectScreen } from "../../screens/Settings/Debug/Generators/GenerateMockAccountsSelect";
import HiddenNftCollections from "../../screens/Settings/Accounts/HiddenNftCollections";
import { useNoNanoBuyNanoWallScreenOptions } from "../../context/NoNanoBuyNanoWall";
import PostOnboardingDebugScreen from "../../screens/PostOnboarding/PostOnboardingDebugScreen";
import { SettingsNavigatorStackParamList } from "./types/SettingsNavigator";
import DebugTermsOfUse from "../../screens/Settings/Debug/Features/TermsOfUse";
import CameraPermissions from "../../screens/Settings/Debug/Debugging/CameraPermissions";
import DebugQueuedDrawers from "../../screens/Settings/Debug/Features/QueuedDrawers";

const Stack = createStackNavigator<SettingsNavigatorStackParamList>();

export default function SettingsNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavConfig = useMemo(
    () => getStackNavigatorConfig(colors),
    [colors],
  );

  const noNanoBuyNanoWallScreenOptions = useNoNanoBuyNanoWallScreenOptions();

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
        name={ScreenName.DebugNetwork}
        component={DebugNetwork}
        options={{
          title: "Network",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugConfiguration}
        component={DebugConfiguration}
        options={{
          title: "Configuration",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugDebugging}
        component={DebugDebugging}
        options={{
          title: "Debugging",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugInformation}
        component={DebugInformation}
        options={{
          title: "Information",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugGenerators}
        component={DebugGenerators}
        options={{
          title: "Generators and Destructors",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugConnectivity}
        component={DebugConnectivity}
        options={{
          title: "Connectivity",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugFeatures}
        component={DebugFeatures}
        options={{
          title: "Features",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugFeatureFlags}
        component={DebugFeatureFlags}
        options={{
          title: "Feature Flags",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugInstallSetOfApps}
        component={DebugInstallSetOfApps}
        options={{
          title: "Install set of apps",
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
          title: "Export Accounts and Settings",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugPlayground}
        component={DebugPlayground}
        options={{
          title: "Playground",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugBluetoothAndLocationServices}
        component={DebugBluetoothAndLocationServices}
        options={{
          title: "Bluetooth and location services",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugSwap}
        component={DebugSwap}
        options={{
          title: "Swap",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugBLE}
        component={DebugBLE}
        options={({ route, navigation }) => ({
          title: "BLE Debugging",
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
        name={ScreenName.DebugCommandSender}
        component={DebugCommandSender}
        options={{
          title: "Command Sender",
        }}
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
          title: "Errors and crashes",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugStore}
        component={DebugStore}
        options={{
          title: "Application state",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugEnv}
        component={DebugEnv}
        options={{
          title: "Environment Variables",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugHttpTransport}
        component={DebugHttpTransport}
        options={{
          title: "HTTP Transport",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugLogs}
        component={DebugLogs}
        options={{
          title: "Logs",
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
        name={ScreenName.DebugVideos}
        component={DebugVideos}
        options={{
          title: "Debug Videos",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugFetchCustomImage}
        component={DebugFetchCustomImage}
        options={{
          title: "Debug FetchCustomImage",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugFirmwareUpdate}
        component={DebugFirmwareUpdate}
        options={{
          title: "Debug FirmwareUpdate",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugCustomImageGraphics}
        component={DebugCustomImageGraphics}
        options={{
          title: "Custom image graphics",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugStoryly}
        component={DebugStoryly}
        options={{
          title: "Debug Storyly",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugTermsOfUse}
        component={DebugTermsOfUse}
        options={{
          title: "Debug Terms of Use",
        }}
      />
      <Stack.Screen
        name={ScreenName.BenchmarkQRStream}
        component={DebugBenchmarkQRStream}
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
      <Stack.Screen
        name={ScreenName.DebugCameraPermissions}
        component={CameraPermissions}
      />
      <Stack.Screen
        name={ScreenName.DebugPerformance}
        component={DebugPerformance}
        options={{
          title: "Performance",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugQueuedDrawers}
        component={DebugQueuedDrawers}
        options={{
          title: "Debug bottom drawers",
        }}
      />
    </Stack.Navigator>
  );
}
