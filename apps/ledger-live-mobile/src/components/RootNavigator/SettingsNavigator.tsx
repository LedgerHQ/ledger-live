import React, { useMemo } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "styled-components/native";
import { ScreenName } from "~/const";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import HelpButton from "~/screens/Settings/HelpButton";
import { useNoNanoBuyNanoWallScreenOptions } from "~/context/NoNanoBuyNanoWall";
import { SettingsNavigatorStackParamList } from "./types/SettingsNavigator";
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
        getComponent={() => require("~/screens/Settings").default}
        options={{
          title: t("settings.header"),
          headerRight: () => <HelpButton />,
        }}
      />
      <Stack.Screen
        name={ScreenName.CountervalueSettings}
        getComponent={() => require("~/screens/Settings/General/CountervalueSettings").default}
        options={{
          title: t("settings.display.counterValue"),
        }}
      />
      <Stack.Screen
        name={ScreenName.GeneralSettings}
        getComponent={() => require("~/screens/Settings/General").default}
        layout={unmountOnBlur}
        options={{
          title: t("settings.display.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.AnalyticsPreferencesSettings}
        getComponent={() => require("~/screens/Settings/AnalyticsPreferencesSettings").default}
        options={{
          title: "",
          headerStyle: {
            backgroundColor: colors.neutral.c00,
          },
        }}
      />
      <Stack.Screen
        name={ScreenName.AccountsSettings}
        getComponent={() => require("~/screens/Settings/Accounts").default}
        options={{
          title: t("settings.accounts.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.AboutSettings}
        getComponent={() => require("~/screens/Settings/About").default}
        options={{
          title: t("settings.about.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.NotificationsSettings}
        getComponent={() => require("~/screens/Settings/Notifications").default}
        options={{
          title: t("settings.notifications.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.HelpSettings}
        getComponent={() => require("~/screens/Settings/Help").default}
        options={{
          title: t("settings.help.header"),
        }}
      />
      <Stack.Screen
        name={ScreenName.Resources}
        getComponent={() => require("~/screens/Settings/Resources").default}
        options={{ title: t("settings.resources") }}
      />
      <Stack.Screen
        name={ScreenName.CryptoAssetsSettings}
        getComponent={() =>
          require("~/screens/Settings/CryptoAssets/Currencies/CurrenciesList").default
        }
        options={{ title: t("settings.accounts.cryptoAssets.header") }}
      />
      <Stack.Screen
        name={ScreenName.CurrencySettings}
        getComponent={() =>
          require("~/screens/Settings/CryptoAssets/Currencies/CurrencySettings").default
        }
        options={({ route }) => ({
          title: route.params?.headerTitle,
          headerRight: undefined,
        })}
        {...noNanoBuyNanoWallScreenOptions}
      />

      <Stack.Screen
        name={ScreenName.EditCurrencyUnits}
        getComponent={() =>
          require("~/screens/Settings/CryptoAssets/Currencies/EditCurrencyUnits").default
        }
        options={{
          title: t("account.settings.accountUnits.title"),
        }}
      />

      <Stack.Screen
        name={ScreenName.ExperimentalSettings}
        getComponent={() => require("~/screens/Settings/Experimental").default}
        options={{
          title: t("settings.experimental.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.DeveloperSettings}
        getComponent={() => require("~/screens/Settings/Developer").default}
        options={{
          title: t("settings.developer.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.DeveloperCustomManifest}
        getComponent={() => require("~/screens/Settings/Developer").DeveloperCustomManifest}
        options={{
          title: t("settings.developer.customManifest.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.ExchangeDeveloperMode}
        getComponent={() => require("~/screens/Settings/Developer").ExchangeDeveloperMode}
        options={{
          title: t("settings.developer.exchangeDeveloperMode.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.CustomCALRefInput}
        getComponent={() => require("~/screens/Settings/Developer/CustomCALRefInput").default}
        options={{
          title: t("settings.developer.customCALRef.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugSettings}
        getComponent={() => require("~/screens/Settings/Debug").default}
        options={{
          title: "Debug",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugAnalyticsConsentQA}
        getComponent={() => require("~/screens/Settings/Debug/AnalyticsConsentQA").default}
        options={{
          title: "Analytics consent QA",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugNotificationsPromptQA}
        getComponent={() => require("~/screens/Settings/Debug/NotificationsPromptQA").default}
        options={{
          title: "Notifications prompt — QA",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugNetwork}
        getComponent={() => require("~/screens/Settings/Debug/Debugging/Network").default}
        options={{
          title: "Network",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugConfiguration}
        getComponent={() => require("~/screens/Settings/Debug/Configuration").default}
        options={{
          title: "Configuration",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugDebugging}
        getComponent={() => require("~/screens/Settings/Debug/Debugging").default}
        options={{
          title: "Debugging",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugInformation}
        getComponent={() => require("~/screens/Settings/Debug/Information").default}
        options={{
          title: "Information",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugGenerators}
        getComponent={() => require("~/screens/Settings/Debug/Generators").default}
        options={{
          title: "Generators and Destructors",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugContentCards}
        getComponent={() => require("~/screens/Settings/Debug/ContentCards").default}
        options={{
          title: t("settings.debug.contentCards.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugConnectivity}
        getComponent={() => require("~/screens/Settings/Debug/Connectivity").default}
        options={() => require("~/screens/Settings/Debug/Connectivity").connectivityHeaderOptions}
      />
      <Stack.Screen
        name={ScreenName.DebugFeatures}
        getComponent={() => require("~/screens/Settings/Debug/Features").default}
        options={{
          title: "Features",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugDeviceIntentExecutor}
        getComponent={() =>
          require("~/screens/Settings/Debug/Features/DeviceIntentExecutor").default
        }
        options={{
          title: "Device Intent Executor",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugDeviceIntentExecutorContent}
        getComponent={() =>
          require("~/screens/Settings/Debug/Features/DeviceIntentExecutor/DeviceActionContentScreen")
            .default
        }
        options={{
          title: "DIE Device Action Content",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugDeviceIntentExecutorInfoState}
        getComponent={() =>
          require("~/screens/Settings/Debug/Features/DeviceIntentExecutor/InfoStateScreen").default
        }
        options={{
          title: "DIE Info State",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugDeviceIntentExecutorConnectDevice}
        getComponent={() =>
          require("~/screens/Settings/Debug/Features/DeviceIntentExecutor/ConnectDeviceScreen")
            .default
        }
        options={{
          title: "DIE Connect Device",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugDeviceIntentExecutorContactsValidation}
        getComponent={() =>
          require("~/screens/Settings/Debug/Features/DeviceIntentExecutor/ContactsValidationScreen")
            .default
        }
        options={{
          title: "DIE Contacts validation",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugDeviceIntentExecutorInitialization}
        getComponent={() =>
          require("~/screens/Settings/Debug/Features/DeviceIntentExecutor/InitializationScreen")
            .default
        }
        options={{
          title: "DIE Initialization",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugDeviceIntentExecutorInitializerStates}
        getComponent={() =>
          require("~/screens/Settings/Debug/Features/DeviceIntentExecutor/InitializerStatesScreen")
            .default
        }
        options={{
          title: "DIE Initializer States",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugDeviceIntentExecutorOrchestration}
        getComponent={() =>
          require("~/screens/Settings/Debug/Features/DeviceIntentExecutor/OrchestrationScreen")
            .default
        }
        options={{
          title: "DIE Orchestration",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugFeatureFlags}
        getComponent={() => require("~/screens/FeatureFlagsSettings").default}
        options={{
          title: "Feature Flags",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugLargeScreenUpsell}
        getComponent={() => require("LLM/features/LargeScreenUpsell/Debug").default}
        options={{
          title: "Large-screen upsell",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugInstallSetOfApps}
        getComponent={() => require("~/screens/Settings/Debug/Features/InstallSetOfApps").default}
        options={{
          title: "Install set of apps",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugMockGenerateAccounts}
        getComponent={() =>
          require("~/screens/Settings/Debug/Generators/GenerateMockAccountsSelect")
            .GenerateMockAccountSelectScreen
        }
        options={{
          title: "Generate mock accounts",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugMockGenerateAccountsByType}
        getComponent={() =>
          require("~/screens/Settings/Debug/Generators/GenerateMockAccountsByType").default
        }
        options={{
          title: "Generate accounts by type",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugPlayground}
        getComponent={() => require("~/screens/Settings/Debug/Playground").default}
        options={{
          title: "Playground",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugWallet40}
        getComponent={() => require("~/screens/Settings/Debug/Debugging/Wallet40").default}
        options={{
          title: "Wallet 4.0",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugContacts}
        getComponent={() => require("~/screens/Settings/Debug/Debugging/Contacts").default}
        options={{
          title: "Contacts",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugDevTools}
        getComponent={() => require("LLM/features/DevTools/screens/DevToolsScreen").default}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugBluetoothAndLocationServices}
        getComponent={() =>
          require("~/screens/Settings/Debug/Debugging/BluetoothAndLocationServices").default
        }
        options={{
          title: "Bluetooth and location services",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugStorageMigration}
        getComponent={() =>
          require("~/screens/Settings/Debug/Debugging/StorageMigration").DebugStorageMigration
        }
        options={{
          title: "Storage migration",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugSwap}
        getComponent={() => require("~/screens/Settings/Debug/Features/Swap").default}
        options={{
          title: "Swap",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugBLEDevicePairing}
        getComponent={() =>
          require("~/screens/Settings/Debug/Features/BleDevicePairingScreen").default
        }
        options={{
          title: "Debug Ble Pairing Flow",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugCommandSender}
        getComponent={() => require("~/screens/Settings/Debug/Connectivity/CommandSender").default}
        options={{
          title: "Command Sender",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugCrash}
        getComponent={() => require("~/screens/Settings/Debug/Debugging/Crashes").default}
        options={{
          title: "Errors and crashes",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugStore}
        getComponent={() => require("~/screens/Settings/Debug/Debugging/Store").default}
        options={{
          title: "Application state",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugEnv}
        getComponent={() => require("~/screens/Settings/Debug/Configuration/DebugEnv").default}
        options={{
          title: "Environment Variables",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugHttpTransport}
        getComponent={() =>
          require("~/screens/Settings/Debug/Connectivity/DebugHttpTransport").default
        }
        options={{
          title: "HTTP Transport",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugLogs}
        getComponent={() => require("~/screens/Settings/Debug/Debugging/Logs").default}
        options={{
          title: "Logs",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugLottie}
        getComponent={() => require("~/screens/Settings/Debug/Features/Lottie").default}
        options={{
          title: "Debug Lottie",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugVideos}
        getComponent={() => require("~/screens/Settings/Debug/Features/Videos").default}
        options={{
          title: "Debug Videos",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugTooltip}
        getComponent={() => require("~/screens/Settings/Debug/Features/TooltipDemo").default}
        options={{
          title: "Debug Tooltip",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugFetchCustomImage}
        getComponent={() => require("~/screens/Settings/Debug/Features/FetchCustomImage").default}
        options={() =>
          require("~/screens/Settings/Debug/Features/FetchCustomImage")
            .debugFetchCustomImageHeaderOptions
        }
      />
      <Stack.Screen
        name={ScreenName.DebugFirmwareUpdate}
        getComponent={() => require("~/screens/Settings/Debug/Features/FirmwareUpdate").default}
        options={{
          title: "Debug Firmware update",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugCustomImageGraphics}
        getComponent={() =>
          require("~/screens/Settings/Debug/Features/CustomImageGraphics").default
        }
        options={{
          title: "Custom image graphics",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugSnackbars}
        getComponent={() => require("~/screens/Settings/Debug/Features/Snackbars").default}
        options={{
          title: "Debug snackbars",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugTransactionsAlerts}
        getComponent={() => require("~/screens/Settings/Debug/Features/TransactionsAlerts").default}
        options={{
          title: "Debug transactions alerts",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugTermsOfUse}
        getComponent={() => require("~/screens/Settings/Debug/Features/TermsOfUse").default}
        options={{
          title: "Debug Terms of Use",
        }}
      />
      <Stack.Screen
        name={ScreenName.BenchmarkQRStream}
        getComponent={() => require("~/screens/Settings/Debug/Broken/BenchmarkQRStream").default}
        options={{
          title: "Benchmark QRStream",
        }}
      />
      <Stack.Screen
        name={ScreenName.OnboardingLanguage}
        getComponent={() => require("~/screens/Onboarding/steps/language").default}
        options={{
          presentation: "transparentModal",
          animation: "slide_from_bottom",
          headerShown: true,
          headerTitle: t("onboarding.stepLanguage.title"),
        }}
      />
      <Stack.Screen
        name={ScreenName.PostOnboardingDebugScreen}
        getComponent={() => require("~/screens/PostOnboarding/PostOnboardingDebugScreen").default}
      />
      <Stack.Screen
        name={ScreenName.DebugCameraPermissions}
        getComponent={() => require("~/screens/Settings/Debug/Debugging/CameraPermissions").default}
      />
      <Stack.Screen
        name={ScreenName.DebugPerformance}
        getComponent={() => require("~/screens/Settings/Debug/Performance").default}
        options={{
          title: "Performance",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugQueuedDrawers}
        getComponent={() => require("LLM/components/QueuedDrawer/TestScreens").MainTestScreen}
        options={{
          title: "QueuedDrawers",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugQueuedDrawerScreen0}
        getComponent={() => require("LLM/components/QueuedDrawer/TestScreens").EmptyScreen}
        options={{
          title: "Empty screen",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugQueuedDrawerScreen1}
        getComponent={() =>
          require("LLM/components/QueuedDrawer/TestScreens")
            .TestScreenWithDrawerRequestingToBeOpened
        }
        options={{
          title: "QueuedDrawers (Auto open)",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugQueuedDrawerScreen2}
        getComponent={() =>
          require("LLM/components/QueuedDrawer/TestScreens").TestScreenWithDrawerForcingToBeOpened
        }
        options={{
          title: "QueuedDrawers (Auto force open)",
        }}
      />
      <Stack.Screen
        name={ScreenName.LargeMoverLandingPage}
        getComponent={() =>
          require("LLM/features/LandingPages/screens/LargeMoverLandingPage").LargeMoverLandingPage
        }
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugSwipe}
        getComponent={() => require("~/screens/Settings/Debug/Features/SwiperScreenDebug").default}
        options={{
          title: "Swiper Screen Debug",
        }}
      />

      <Stack.Screen
        name={ScreenName.DebugModularAssetDrawer}
        getComponent={() => require("LLM/features/ModularDrawer/Debug").default}
        options={{
          title: "ModularAssetDrawer Screen Debug",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugWalletV4Tour}
        getComponent={() => require("LLM/features/WalletV4Tour/Debug").default}
        options={{
          title: "Wallet V4 Tour",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugProductTour}
        getComponent={() => require("LLM/features/ProductTour/Debug").default}
        options={{
          title: "Product Tour",
        }}
      />
      <Stack.Screen
        name={ScreenName.DebugQ2WalletV4Tour}
        getComponent={() => require("LLM/features/Q2WalletV4Tour/Debug").default}
        options={{
          title: "Q2 Wallet V4 Tour",
        }}
      />
    </Stack.Navigator>
  );
}
