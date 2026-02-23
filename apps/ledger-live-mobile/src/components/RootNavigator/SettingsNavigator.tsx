import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import DebugBenchmarkQRStream from "~/screens/Settings/Debug/Broken/BenchmarkQRStream";
import DebugConfiguration from "~/screens/Settings/Debug/Configuration";
import DebugConnectivity, {
  connectivityHeaderOptions,
} from "~/screens/Settings/Debug/Connectivity";
import DebugCrash from "~/screens/Settings/Debug/Debugging/Crashes";
import DebugCustomImageGraphics from "~/screens/Settings/Debug/Features/CustomImageGraphics";
import DebugDebugging from "~/screens/Settings/Debug/Debugging";
import DebugEnv from "~/screens/Settings/Debug/Configuration/DebugEnv";
import DebugFeatureFlags from "~/screens/FeatureFlagsSettings";
import DebugFeatures from "~/screens/Settings/Debug/Features";
import DebugFetchCustomImage, {
  debugFetchCustomImageHeaderOptions,
} from "~/screens/Settings/Debug/Features/FetchCustomImage";
import DebugFirmwareUpdate from "~/screens/Settings/Debug/Features/FirmwareUpdate";
import DebugGenerators from "~/screens/Settings/Debug/Generators";
import DebugContentCards from "~/screens/Settings/Debug/ContentCards";
import DebugHttpTransport from "~/screens/Settings/Debug/Connectivity/DebugHttpTransport";
import DebugInformation from "~/screens/Settings/Debug/Information";
import DebugInstallSetOfApps from "~/screens/Settings/Debug/Features/InstallSetOfApps";
import DebugPerformance from "~/screens/Settings/Debug/Performance";
import DebugLogs from "~/screens/Settings/Debug/Debugging/Logs";
import DebugLottie from "~/screens/Settings/Debug/Features/Lottie";
import DebugLumen from "~/screens/Settings/Debug/Debugging/Lumen";
import DebugWallet40 from "~/screens/Settings/Debug/Debugging/Wallet40";
import DebugNetwork from "~/screens/Settings/Debug/Debugging/Network";
import DebugCommandSender from "~/screens/Settings/Debug/Connectivity/CommandSender";
import DebugPlayground from "~/screens/Settings/Debug/Playground";
import DebugBluetoothAndLocationServices from "~/screens/Settings/Debug/Debugging/BluetoothAndLocationServices";
import DebugSettings from "~/screens/Settings/Debug";
import DebugSnackbars from "~/screens/Settings/Debug/Features/Snackbars";
import DebugTransactionsAlerts from "~/screens/Settings/Debug/Features/TransactionsAlerts";
import DebugStore from "~/screens/Settings/Debug/Debugging/Store";
import DebugSwap from "~/screens/Settings/Debug/Features/Swap";
import DebugVideos from "~/screens/Settings/Debug/Features/Videos";
import TooltipDemo from "~/screens/Settings/Debug/Features/TooltipDemo";
import Settings from "~/screens/Settings";
import AccountsSettings from "~/screens/Settings/Accounts";
import AboutSettings from "~/screens/Settings/About";
import Resources from "~/screens/Settings/Resources";
import GeneralSettings from "~/screens/Settings/General";
import CountervalueSettings from "~/screens/Settings/General/CountervalueSettings";
import NotificationsSettings from "~/screens/Settings/Notifications";
import HelpSettings from "~/screens/Settings/Help";
import RegionSettings from "~/screens/Settings/General/Region";
import CurrenciesList from "~/screens/Settings/CryptoAssets/Currencies/CurrenciesList";
import CurrencySettings from "~/screens/Settings/CryptoAssets/Currencies/CurrencySettings";
import ExperimentalSettings from "~/screens/Settings/Experimental";
import DeveloperSettings, {
  DeveloperCustomManifest,
  ExchangeDeveloperMode,
} from "~/screens/Settings/Developer";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import HelpButton from "~/screens/Settings/HelpButton";
import OnboardingStepLanguage from "~/screens/Onboarding/steps/language";
import { GenerateMockAccountSelectScreen } from "~/screens/Settings/Debug/Generators/GenerateMockAccountsSelect";
import { useNoNanoBuyNanoWallScreenOptions } from "~/context/NoNanoBuyNanoWall";
import PostOnboardingDebugScreen from "~/screens/PostOnboarding/PostOnboardingDebugScreen";
import { SettingsNavigatorStackParamList } from "./types/SettingsNavigator";
import DebugTermsOfUse from "~/screens/Settings/Debug/Features/TermsOfUse";
import CameraPermissions from "~/screens/Settings/Debug/Debugging/CameraPermissions";
import BleEDevicePairingScreen from "~/screens/Settings/Debug/Features/BleDevicePairingScreen";
import EditCurrencyUnits from "~/screens/Settings/CryptoAssets/Currencies/EditCurrencyUnits";
import {
  EmptyScreen,
  MainTestScreen,
  TestScreenWithDrawerForcingToBeOpened,
  TestScreenWithDrawerRequestingToBeOpened,
} from "LLM/components/QueuedDrawer/TestScreens";
import { LargeMoverLandingPage } from "LLM/features/LandingPages/screens/LargeMoverLandingPage";
import SwiperScreenDebug from "~/screens/Settings/Debug/Features/SwiperScreenDebug";
import { DebugStorageMigration } from "~/screens/Settings/Debug/Debugging/StorageMigration";
import CustomCALRefInput from "~/screens/Settings/Developer/CustomCALRefInput";
import ModularDrawerScreenDebug from "LLM/features/ModularDrawer/Debug";
import WalletV4TourScreenDebug from "LLM/features/WalletV4Tour/Debug";
import { UnmountOnBlur } from "./utils/UnmountOnBlur";

const Stack = createNativeStackNavigator<SettingsNavigatorStackParamList>();

const unmountOnBlur = ({ children }: { children: React.ReactNode }) => (
  <UnmountOnBlur>{children}</UnmountOnBlur>
);

export default function SettingsNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavConfig = useMemo(() => getStackNavigatorConfig(colors), [colors]);
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
        name={ScreenName.DebugContentCards}
        component={DebugContentCards}
        options={{
          title: t("settings.debug.contentCards.title"),
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
        name={ScreenName.DebugLumen}
        component={DebugLumen}
        options={{
          title: "Lumen Debug",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugWallet40}
        component={DebugWallet40}
        options={{
          title: "Wallet 4.0",
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
      <Stack.Screen
        name={ScreenName.LargeMoverLandingPage}
        component={LargeMoverLandingPage}
        options={{
          headerShown: false,
        }}
      />
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
      <Stack.Screen
        name={ScreenName.DebugWalletV4Tour}
        component={WalletV4TourScreenDebug}
        options={{
          title: "Wallet V4 Tour",
        }}
      />
    </Stack.Navigator>
  );
}
