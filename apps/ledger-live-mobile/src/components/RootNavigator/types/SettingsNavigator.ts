import { Device } from "@ledgerhq/react-native-hw-transport-ble/lib/types";
import { ScreenName } from "../../../const";

export type SettingsNavigatorStackParamList = {
  [ScreenName.SettingsScreen]: undefined;
  [ScreenName.CountervalueSettings]: undefined;
  [ScreenName.RegionSettings]: undefined;
  [ScreenName.GeneralSettings]: undefined;
  [ScreenName.AccountsSettings]: undefined;
  [ScreenName.AboutSettings]: undefined;
  [ScreenName.NotificationsSettings]: undefined;
  [ScreenName.HelpSettings]: undefined;
  [ScreenName.Resources]: undefined;
  [ScreenName.CryptoAssetsSettings]: undefined;
  [ScreenName.HiddenNftCollections]: undefined;
  [ScreenName.CurrencySettings]: {
    currencyId: string;
    headerTitle?: string;
  };
  [ScreenName.RepairDevice]: undefined;
  [ScreenName.ExperimentalSettings]: undefined;
  [ScreenName.DeveloperSettings]: undefined;
  [ScreenName.DeveloperCustomManifest]: undefined;
  [ScreenName.DebugSettings]: undefined;
  [ScreenName.DebugDevices]: undefined;
  [ScreenName.DebugFeatureFlags]: undefined;
  [ScreenName.DebugMocks]:
    | {
        pairedDevice?: Device | null;
      }
    | undefined;
  [ScreenName.DebugMockGenerateAccounts]: undefined;
  [ScreenName.DebugExport]: undefined;
  [ScreenName.DebugSwap]: undefined;
  [ScreenName.DebugBLE]: {
    deviceId: string;
  };
  [ScreenName.DebugBLEBenchmark]: {
    deviceId: string;
  };
  [ScreenName.DebugCrash]: undefined;
  [ScreenName.DebugStore]: undefined;
  [ScreenName.DebugEnv]: undefined;
  [ScreenName.DebugHttpTransport]: undefined;
  [ScreenName.DebugLogs]: undefined;
  [ScreenName.DebugIcons]: undefined;
  [ScreenName.DebugLottie]: undefined;
  [ScreenName.DebugPlayground]: undefined;
  [ScreenName.BenchmarkQRStream]: undefined;
  [ScreenName.OnboardingLanguage]: undefined;
  [ScreenName.PostOnboardingDebugScreen]: undefined;
  [ScreenName.DebugMultiAppInstall]: undefined;
};
