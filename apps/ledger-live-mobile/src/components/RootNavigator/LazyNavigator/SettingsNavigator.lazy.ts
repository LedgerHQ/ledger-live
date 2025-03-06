import { ScreenName } from "~/const";
import { registerAppScreen } from "LLM/performance/apis";

export const SettingsScreen = registerAppScreen<typeof import("~/screens/Settings").default>({
  loader: () => import("~/screens/Settings"),
  name: ScreenName.SettingsScreen,
});

export const CountervalueSettings = registerAppScreen<
  typeof import("~/screens/Settings/General/CountervalueSettings").default
>({
  loader: () => import("~/screens/Settings/General/CountervalueSettings"),
  name: ScreenName.CountervalueSettings,
  group: "Settings",
});

export const RegionSettings = registerAppScreen<
  typeof import("~/screens/Settings/General/Region").default
>({
  loader: () => import("~/screens/Settings/General/Region"),
  name: ScreenName.RegionSettings,
  group: "Settings",
});

export const GeneralSettings = registerAppScreen<
  typeof import("~/screens/Settings/General").default
>({
  loader: () => import("~/screens/Settings/General"),
  name: ScreenName.GeneralSettings,
  group: "Settings",
});

export const AccountsSettings = registerAppScreen<
  typeof import("~/screens/Settings/Accounts").default
>({
  loader: () => import("~/screens/Settings/Accounts"),
  name: ScreenName.AccountsSettings,
  group: "Settings",
});

export const AboutSettings = registerAppScreen<typeof import("~/screens/Settings/About").default>({
  loader: () => import("~/screens/Settings/About"),
  name: ScreenName.AboutSettings,
  group: "Settings",
});

export const NotificationsSettings = registerAppScreen<
  typeof import("~/screens/Settings/Notifications").default
>({
  loader: () => import("~/screens/Settings/Notifications"),
  name: ScreenName.NotificationsSettings,
  group: "Settings",
});

export const HelpSettings = registerAppScreen<typeof import("~/screens/Settings/Help").default>({
  loader: () => import("~/screens/Settings/Help"),
  name: ScreenName.HelpSettings,
  group: "Settings",
});

export const Resources = registerAppScreen<typeof import("~/screens/Settings/Resources").default>({
  loader: () => import("~/screens/Settings/Resources"),
  name: ScreenName.Resources,
  group: "Settings",
});

export const CurrenciesList = registerAppScreen<
  typeof import("~/screens/Settings/CryptoAssets/Currencies/CurrenciesList").default
>({
  loader: () => import("~/screens/Settings/CryptoAssets/Currencies/CurrenciesList"),
  name: ScreenName.CryptoAssetsSettings,
  group: "Settings",
});

export const CurrencySettings = registerAppScreen<
  typeof import("~/screens/Settings/CryptoAssets/Currencies/CurrencySettings").default
>({
  loader: () => import("~/screens/Settings/CryptoAssets/Currencies/CurrencySettings"),
  name: ScreenName.CurrencySettings,
  group: "Settings",
});

export const EditCurrencyUnits = registerAppScreen<
  typeof import("~/screens/Settings/CryptoAssets/Currencies/EditCurrencyUnits").default
>({
  loader: () => import("~/screens/Settings/CryptoAssets/Currencies/EditCurrencyUnits"),
  name: ScreenName.EditCurrencyUnits,
  group: "Settings",
});

export const ExperimentalSettings = registerAppScreen<
  typeof import("~/screens/Settings/Experimental").default
>({
  loader: () => import("~/screens/Settings/Experimental"),
  name: ScreenName.ExperimentalSettings,
  group: "Settings",
});

export const DeveloperSettings = registerAppScreen<
  typeof import("~/screens/Settings/Developer").default
>({
  loader: () => import("~/screens/Settings/Developer"),
  name: ScreenName.DeveloperSettings,
  group: "Settings",
});

export const DeveloperCustomManifest = registerAppScreen<
  typeof import("~/screens/Settings/Developer").DeveloperCustomManifest
>({
  loader: () =>
    import("~/screens/Settings/Developer").then(module => module.DeveloperCustomManifest),
  name: ScreenName.DeveloperCustomManifest,
  group: "Settings",
});

export const ExchangeDeveloperMode = registerAppScreen<
  typeof import("~/screens/Settings/Developer").ExchangeDeveloperMode
>({
  loader: () => import("~/screens/Settings/Developer").then(module => module.ExchangeDeveloperMode),
  name: ScreenName.ExchangeDeveloperMode,
  group: "Settings",
});

export const DebugSettings = registerAppScreen<typeof import("~/screens/Settings/Debug").default>({
  loader: () => import("~/screens/Settings/Debug"),
  name: ScreenName.DebugSettings,
  group: "Settings",
});

export const DebugNetwork = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Debugging/Network").default
>({
  loader: () => import("~/screens/Settings/Debug/Debugging/Network"),
  name: ScreenName.DebugNetwork,
  group: "Settings",
});

export const DebugConfiguration = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Configuration").default
>({
  loader: () => import("~/screens/Settings/Debug/Configuration"),
  name: ScreenName.DebugConfiguration,
  group: "Settings",
});

export const DebugDebugging = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Debugging").default
>({
  loader: () => import("~/screens/Settings/Debug/Debugging"),
  name: ScreenName.DebugDebugging,
  group: "Settings",
});

export const DebugInformation = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Information").default
>({
  loader: () => import("~/screens/Settings/Debug/Information"),
  name: ScreenName.DebugInformation,
  group: "Settings",
});

export const DebugGenerators = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Generators").default
>({
  loader: () => import("~/screens/Settings/Debug/Generators"),
  name: ScreenName.DebugGenerators,
  group: "Settings",
});

export const DebugConnectivity = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Connectivity").default
>({
  loader: () => import("~/screens/Settings/Debug/Connectivity"),
  name: ScreenName.DebugConnectivity,
  group: "Settings",
});

export const DebugFeatures = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Features").default
>({
  loader: () => import("~/screens/Settings/Debug/Features"),
  name: ScreenName.DebugFeatures,
  group: "Settings",
});

export const DebugFeatureFlags = registerAppScreen<
  typeof import("~/screens/FeatureFlagsSettings").default
>({
  loader: () => import("~/screens/FeatureFlagsSettings"),
  name: ScreenName.DebugFeatureFlags,
  group: "Settings",
});

export const DebugInstallSetOfApps = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Features/InstallSetOfApps").default
>({
  loader: () => import("~/screens/Settings/Debug/Features/InstallSetOfApps"),
  name: ScreenName.DebugInstallSetOfApps,
  group: "Settings",
});

export const GenerateMockAccountSelectScreen = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Generators/GenerateMockAccountsSelect").default
>({
  loader: () => import("~/screens/Settings/Debug/Generators/GenerateMockAccountsSelect"),
  name: ScreenName.DebugMockGenerateAccounts,
  group: "Settings",
});

export const DebugExport = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Features/ExportAccounts").default
>({
  loader: () => import("~/screens/Settings/Debug/Features/ExportAccounts"),
  name: ScreenName.DebugExport,
  group: "Settings",
});

export const DebugPlayground = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Playground").default
>({
  loader: () => import("~/screens/Settings/Debug/Playground"),
  name: ScreenName.DebugPlayground,
  group: "Settings",
});

export const DebugBluetoothAndLocationServices = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Debugging/BluetoothAndLocationServices").default
>({
  loader: () => import("~/screens/Settings/Debug/Debugging/BluetoothAndLocationServices"),
  name: ScreenName.DebugBluetoothAndLocationServices,
  group: "Settings",
});

export const DebugSwap = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Features/Swap").default
>({
  loader: () => import("~/screens/Settings/Debug/Features/Swap"),
  name: ScreenName.DebugSwap,
  group: "Settings",
});

export const DebugBLE = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Connectivity/BLE").default
>({
  loader: () => import("~/screens/Settings/Debug/Connectivity/BLE"),
  name: ScreenName.DebugBLE,
  group: "Settings",
});

export const BleEDevicePairingScreen = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Features/BleDevicePairingScreen").default
>({
  loader: () => import("~/screens/Settings/Debug/Features/BleDevicePairingScreen"),
  name: ScreenName.DebugBLEDevicePairing,
  group: "Settings",
});

export const DebugCommandSender = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Connectivity/CommandSender").default
>({
  loader: () => import("~/screens/Settings/Debug/Connectivity/CommandSender"),
  name: ScreenName.DebugCommandSender,
  group: "Settings",
});

export const DebugBLEBenchmark = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Connectivity/BLEBenchmark").default
>({
  loader: () => import("~/screens/Settings/Debug/Connectivity/BLEBenchmark"),
  name: ScreenName.DebugBLEBenchmark,
  group: "Settings",
});

export const DebugCrash = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Debugging/Crashes").default
>({
  loader: () => import("~/screens/Settings/Debug/Debugging/Crashes"),
  name: ScreenName.DebugCrash,
  group: "Settings",
});

export const DebugStore = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Debugging/Store").default
>({
  loader: () => import("~/screens/Settings/Debug/Debugging/Store"),
  name: ScreenName.DebugStore,
  group: "Settings",
});

export const DebugEnv = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Configuration/DebugEnv").default
>({
  loader: () => import("~/screens/Settings/Debug/Configuration/DebugEnv"),
  name: ScreenName.DebugEnv,
  group: "Settings",
});

export const DebugHttpTransport = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Connectivity/DebugHttpTransport").default
>({
  loader: () => import("~/screens/Settings/Debug/Connectivity/DebugHttpTransport"),
  name: ScreenName.DebugHttpTransport,
  group: "Settings",
});

export const DebugLogs = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Debugging/Logs").default
>({
  loader: () => import("~/screens/Settings/Debug/Debugging/Logs"),
  name: ScreenName.DebugLogs,
  group: "Settings",
});

export const DebugLottie = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Features/Lottie").default
>({
  loader: () => import("~/screens/Settings/Debug/Features/Lottie"),
  name: ScreenName.DebugLottie,
  group: "Settings",
});

export const DebugVideos = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Features/Videos").default
>({
  loader: () => import("~/screens/Settings/Debug/Features/Videos"),
  name: ScreenName.DebugVideos,
  group: "Settings",
});

export const DebugFetchCustomImage = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Features/FetchCustomImage").default
>({
  loader: () => import("~/screens/Settings/Debug/Features/FetchCustomImage"),
  name: ScreenName.DebugFetchCustomImage,
  group: "Settings",
});

export const DebugFirmwareUpdate = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Features/FirmwareUpdate").default
>({
  loader: () => import("~/screens/Settings/Debug/Features/FirmwareUpdate"),
  name: ScreenName.DebugFirmwareUpdate,
  group: "Settings",
});

export const DebugCustomImageGraphics = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Features/CustomImageGraphics").default
>({
  loader: () => import("~/screens/Settings/Debug/Features/CustomImageGraphics"),
  name: ScreenName.DebugCustomImageGraphics,
  group: "Settings",
});

export const DebugSnackbars = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Features/Snackbars").default
>({
  loader: () => import("~/screens/Settings/Debug/Features/Snackbars"),
  name: ScreenName.DebugSnackbars,
  group: "Settings",
});

export const DebugTransactionsAlerts = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Features/TransactionsAlerts").default
>({
  loader: () => import("~/screens/Settings/Debug/Features/TransactionsAlerts"),
  name: ScreenName.DebugTransactionsAlerts,
  group: "Settings",
});

export const DebugStoryly = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Features/Storyly").default
>({
  loader: () => import("~/screens/Settings/Debug/Features/Storyly"),
  name: ScreenName.DebugStoryly,
  group: "Settings",
});

export const DebugTermsOfUse = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Features/TermsOfUse").default
>({
  loader: () => import("~/screens/Settings/Debug/Features/TermsOfUse"),
  name: ScreenName.DebugTermsOfUse,
  group: "Settings",
});

export const DebugBenchmarkQRStream = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Broken/BenchmarkQRStream").default
>({
  loader: () => import("~/screens/Settings/Debug/Broken/BenchmarkQRStream"),
  name: ScreenName.BenchmarkQRStream,
  group: "Settings",
});

export const OnboardingStepLanguage = registerAppScreen<
  typeof import("~/screens/Onboarding/steps/language").default
>({
  loader: () => import("~/screens/Onboarding/steps/language"),
  name: ScreenName.OnboardingLanguage,
  group: "Settings",
});

export const PostOnboardingDebugScreen = registerAppScreen<
  typeof import("~/screens/PostOnboarding/PostOnboardingDebugScreen").default
>({
  loader: () => import("~/screens/PostOnboarding/PostOnboardingDebugScreen"),
  name: ScreenName.PostOnboardingDebugScreen,
  group: "Settings",
});

export const CameraPermissions = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Debugging/CameraPermissions").default
>({
  loader: () => import("~/screens/Settings/Debug/Debugging/CameraPermissions"),
  name: ScreenName.DebugCameraPermissions,
  group: "Settings",
});

export const DebugPerformance = registerAppScreen<
  typeof import("~/screens/Settings/Debug/Performance").default
>({
  loader: () => import("~/screens/Settings/Debug/Performance"),
  name: ScreenName.DebugPerformance,
  group: "Settings",
});

export const MainTestScreen = registerAppScreen<
  typeof import("LLM/components/QueuedDrawer/TestScreens").MainTestScreen
>({
  loader: () =>
    import("LLM/components/QueuedDrawer/TestScreens").then(module => module.MainTestScreen),
  name: ScreenName.DebugQueuedDrawers,
  group: "Settings",
});

export const EmptyScreen = registerAppScreen<
  typeof import("LLM/components/QueuedDrawer/TestScreens").EmptyScreen
>({
  loader: () =>
    import("LLM/components/QueuedDrawer/TestScreens").then(module => module.EmptyScreen),
  name: ScreenName.DebugQueuedDrawerScreen0,
  group: "Settings",
});

export const TestScreenWithDrawerRequestingToBeOpened = registerAppScreen<
  typeof import("LLM/components/QueuedDrawer/TestScreens").TestScreenWithDrawerRequestingToBeOpened
>({
  loader: () =>
    import("LLM/components/QueuedDrawer/TestScreens").then(
      module => module.TestScreenWithDrawerRequestingToBeOpened,
    ),
  name: ScreenName.DebugQueuedDrawerScreen1,
  group: "Settings",
});

export const TestScreenWithDrawerForcingToBeOpened = registerAppScreen<
  typeof import("LLM/components/QueuedDrawer/TestScreens").TestScreenWithDrawerForcingToBeOpened
>({
  loader: () =>
    import("LLM/components/QueuedDrawer/TestScreens").then(
      module => module.TestScreenWithDrawerForcingToBeOpened,
    ),
  name: ScreenName.DebugQueuedDrawerScreen2,
  group: "Settings",
});
