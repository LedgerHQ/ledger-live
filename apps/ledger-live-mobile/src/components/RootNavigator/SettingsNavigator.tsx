import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

import { connectivityHeaderOptions } from "~/screens/Settings/Debug/Connectivity";
import { debugFetchCustomImageHeaderOptions } from "~/screens/Settings/Debug/Features/FetchCustomImage";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import Button from "../Button";
import HelpButton from "~/screens/Settings/HelpButton";
import { useNoNanoBuyNanoWallScreenOptions } from "~/context/NoNanoBuyNanoWall";
import { SettingsNavigatorStackParamList } from "./types/SettingsNavigator";
import { UnmountOnBlur } from "./utils/UnmountOnBlur";
import { lazyLoad } from "LLM/utils/lazyLoad";

const DebugBenchmarkQRStream = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Broken/BenchmarkQRStream"),
});
const DebugBLE = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Connectivity/BLE"),
});
const DebugBLEBenchmark = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Connectivity/BLEBenchmark"),
});
const DebugConfiguration = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Configuration"),
});
const DebugConnectivity = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Connectivity"),
});
const DebugCrash = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Debugging/Crashes"),
});
const DebugCustomImageGraphics = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Features/CustomImageGraphics"),
});
const DebugDebugging = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Debugging"),
});
const DebugEnv = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Configuration/DebugEnv"),
});
const DebugFeatureFlags = lazyLoad({
  loader: () => import("~/screens/FeatureFlagsSettings"),
});
const DebugFeatures = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Features"),
});
const DebugFetchCustomImage = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Features/FetchCustomImage"),
});
const DebugFirmwareUpdate = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Features/FirmwareUpdate"),
});
const DebugGenerators = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Generators"),
});
const DebugHttpTransport = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Connectivity/DebugHttpTransport"),
});
const DebugInformation = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Information"),
});
const DebugInstallSetOfApps = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Features/InstallSetOfApps"),
});
const DebugPerformance = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Performance"),
});
const DebugLogs = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Debugging/Logs"),
});
const DebugLottie = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Features/Lottie"),
});
const DebugNetwork = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Debugging/Network"),
});
const DebugCommandSender = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Connectivity/CommandSender"),
});
const DebugPlayground = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Playground"),
});
const DebugBluetoothAndLocationServices = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Debugging/BluetoothAndLocationServices"),
});
const DebugSettings = lazyLoad({
  loader: () => import("~/screens/Settings/Debug"),
});
const DebugSnackbars = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Features/Snackbars"),
});
const DebugTransactionsAlerts = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Features/TransactionsAlerts"),
});
const DebugStore = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Debugging/Store"),
});
const DebugStoryly = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Features/Storyly"),
});
const DebugSwap = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Features/Swap"),
});
const DebugVideos = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Features/Videos"),
});
const TooltipDemo = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Features/TooltipDemo"),
});
const Settings = lazyLoad({
  loader: () => import("~/screens/Settings"),
});
const AccountsSettings = lazyLoad({
  loader: () => import("~/screens/Settings/Accounts"),
});
const AboutSettings = lazyLoad({
  loader: () => import("~/screens/Settings/About"),
});
const Resources = lazyLoad({
  loader: () => import("~/screens/Settings/Resources"),
});
const GeneralSettings = lazyLoad({
  loader: () => import("~/screens/Settings/General"),
});
const CountervalueSettings = lazyLoad({
  loader: () => import("~/screens/Settings/General/CountervalueSettings"),
});
const NotificationsSettings = lazyLoad({
  loader: () => import("~/screens/Settings/Notifications"),
});
const HelpSettings = lazyLoad({
  loader: () => import("~/screens/Settings/Help"),
});
const RegionSettings = lazyLoad({
  loader: () => import("~/screens/Settings/General/Region"),
});
const CurrenciesList = lazyLoad({
  loader: () => import("~/screens/Settings/CryptoAssets/Currencies/CurrenciesList"),
});
const CurrencySettings = lazyLoad({
  loader: () => import("~/screens/Settings/CryptoAssets/Currencies/CurrencySettings"),
});
const ExperimentalSettings = lazyLoad({
  loader: () => import("~/screens/Settings/Experimental"),
});
const DeveloperSettings = lazyLoad({
  loader: () => import("~/screens/Settings/Developer"),
});
const DeveloperCustomManifest = lazyLoad({
  loader: () => import("~/screens/Settings/Developer").then(m => m.DeveloperCustomManifest),
});
const ExchangeDeveloperMode = lazyLoad({
  loader: () => import("~/screens/Settings/Developer").then(m => m.ExchangeDeveloperMode),
});
const OnboardingStepLanguage = lazyLoad({
  loader: () => import("~/screens/Onboarding/steps/language"),
});
const GenerateMockAccountSelectScreen = lazyLoad({
  loader: () =>
    import("~/screens/Settings/Debug/Generators/GenerateMockAccountsSelect").then(
      m => m.GenerateMockAccountSelectScreen,
    ),
});
const PostOnboardingDebugScreen = lazyLoad({
  loader: () => import("~/screens/PostOnboarding/PostOnboardingDebugScreen"),
});
const DebugTermsOfUse = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Features/TermsOfUse"),
});
const CameraPermissions = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Debugging/CameraPermissions"),
});
const BleEDevicePairingScreen = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Features/BleDevicePairingScreen"),
});
const EditCurrencyUnits = lazyLoad({
  loader: () => import("~/screens/Settings/CryptoAssets/Currencies/EditCurrencyUnits"),
});
const DebugStorageMigration = lazyLoad({
  loader: () =>
    import("~/screens/Settings/Debug/Debugging/StorageMigration").then(
      m => m.DebugStorageMigration,
    ),
});
const CustomCALRefInput = lazyLoad({
  loader: () => import("~/screens/Settings/Developer/CustomCALRefInput"),
});

const LargeMoverLandingPage = lazyLoad({
  loader: () => import("LLM/features/LandingPages/screens/LargeMoverLandingPage"),
});
const ModularDrawerScreenDebug = lazyLoad({
  loader: () => import("LLM/features/ModularDrawer/Debug"),
});
const SwiperScreenDebug = lazyLoad({
  loader: () => import("~/screens/Settings/Debug/Features/SwiperScreenDebug"),
});
const MainTestScreen = lazyLoad({
  loader: () => import("LLM/components/QueuedDrawer/TestScreens"),
});
const TestScreenWithDrawerRequestingToBeOpened = lazyLoad({
  loader: () => import("LLM/components/QueuedDrawer/TestScreens"),
});
const TestScreenWithDrawerForcingToBeOpened = lazyLoad({
  loader: () => import("LLM/components/QueuedDrawer/TestScreens"),
});
const EmptyScreen = lazyLoad({
  loader: () => import("LLM/components/QueuedDrawer/TestScreens"),
});

const Stack = createNativeStackNavigator<SettingsNavigatorStackParamList>();

const unmountOnBlur = ({ children }: { children: React.ReactNode }) => (
  <UnmountOnBlur>{children}</UnmountOnBlur>
);

export default function SettingsNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);

  const noNanoBuyNanoWallScreenOptions = useNoNanoBuyNanoWallScreenOptions();
  const isLargeMoverFeatureEnabled = useFeature("largemoverLandingpage")?.enabled;
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
        layout={unmountOnBlur}
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
        name={ScreenName.CurrencySettings}
        component={CurrencySettings}
        options={({ route }) => ({
          title: route.params?.headerTitle,
          headerRight: undefined,
        })}
        {...noNanoBuyNanoWallScreenOptions}
      />

      <Stack.Screen
        name={ScreenName.EditCurrencyUnits}
        component={EditCurrencyUnits}
        options={{
          title: t("account.settings.accountUnits.title"),
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
          // headerTitleStyle width not supported in native-stack; rely on default layout
        }}
      />
      <Stack.Screen
        name={ScreenName.ExchangeDeveloperMode}
        component={ExchangeDeveloperMode}
        options={{
          title: t("settings.developer.exchangeDeveloperMode.title"),
          // headerTitleStyle width not supported in native-stack; rely on default layout
        }}
      />
      <Stack.Screen
        name={ScreenName.CustomCALRefInput}
        component={CustomCALRefInput}
        options={{
          title: t("settings.developer.customCALRef.title"),
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
        options={connectivityHeaderOptions}
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
        name={ScreenName.DebugStorageMigration}
        component={DebugStorageMigration}
        options={{
          title: "Storage migration",
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
        name={ScreenName.DebugBLEDevicePairing}
        component={BleEDevicePairingScreen}
        options={{
          title: "Debug Ble Pairing Flow",
        }}
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
        name={ScreenName.DebugTooltip}
        component={TooltipDemo}
        options={{
          title: "Debug Tooltip",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugFetchCustomImage}
        component={DebugFetchCustomImage}
        options={debugFetchCustomImageHeaderOptions}
      />
      <Stack.Screen
        name={ScreenName.DebugFirmwareUpdate}
        component={DebugFirmwareUpdate}
        options={{
          title: "Debug Firmware update",
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
        name={ScreenName.DebugSnackbars}
        component={DebugSnackbars}
        options={{
          title: "Debug snackbars",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugTransactionsAlerts}
        component={DebugTransactionsAlerts}
        options={{
          title: "Debug transactions alerts",
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
          presentation: "transparentModal",
          animation: "slide_from_bottom",
          headerShown: true,
          headerTitle: t("onboarding.stepLanguage.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.PostOnboardingDebugScreen}
        component={PostOnboardingDebugScreen}
      />
      <Stack.Screen name={ScreenName.DebugCameraPermissions} component={CameraPermissions} />
      <Stack.Screen
        name={ScreenName.DebugPerformance}
        component={DebugPerformance}
        options={{
          title: "Performance",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugQueuedDrawers}
        component={MainTestScreen}
        options={{
          title: "QueuedDrawers",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugQueuedDrawerScreen0}
        component={EmptyScreen}
        options={{
          title: "Empty screen",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugQueuedDrawerScreen1}
        component={TestScreenWithDrawerRequestingToBeOpened}
        options={{
          title: "QueuedDrawers (Auto open)",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugQueuedDrawerScreen2}
        component={TestScreenWithDrawerForcingToBeOpened}
        options={{
          title: "QueuedDrawers (Auto force open)",
        }}
      />
      {isLargeMoverFeatureEnabled && (
        <Stack.Screen
          name={ScreenName.LargeMoverLandingPage}
          component={LargeMoverLandingPage}
          options={{
            headerShown: false,
          }}
        />
      )}
      <Stack.Screen
        name={ScreenName.DebugSwipe}
        component={SwiperScreenDebug}
        options={{
          title: "Swiper Screen Debug",
        }}
      />

      <Stack.Screen
        name={ScreenName.DebugModularAssetDrawer}
        component={ModularDrawerScreenDebug}
        options={{
          title: "ModularAssetDrawer Screen Debug",
        }}
      />
    </Stack.Navigator>
  );
}
