import type { Device } from "@ledgerhq/types-devices";
import { ScreenName } from "~/const";
import { FilterByDeviceModelId } from "../../BleDevicePairingFlow/BleDevicesScanning";

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
  [ScreenName.CurrencySettings]: {
    currencyId: string;
    headerTitle?: string;
  };
  [ScreenName.ExperimentalSettings]: undefined;
  [ScreenName.DeveloperSettings]: undefined;
  [ScreenName.DeveloperCustomManifest]: undefined;
  [ScreenName.DebugSettings]: undefined;
  [ScreenName.DebugFeatureFlags]: undefined;
  [ScreenName.DebugInformation]: undefined;
  [ScreenName.DebugPerformance]: undefined;
  [ScreenName.DebugDebugging]: undefined;
  [ScreenName.DebugConfiguration]: undefined;
  [ScreenName.DebugFeatures]:
    | {
        pairedDevice?: Device | null;
      }
    | undefined;
  [ScreenName.DebugConnectivity]: undefined;
  [ScreenName.DebugGenerators]: undefined;
  [ScreenName.DebugMockGenerateAccounts]: undefined;
  [ScreenName.DebugExport]: undefined;
  [ScreenName.DebugNetwork]: undefined;
  [ScreenName.DebugCommandSender]: {
    deviceId: string;
  };
  [ScreenName.DebugSwap]: undefined;
  [ScreenName.DebugBLE]: {
    deviceId: string;
  };
  [ScreenName.DebugBLEBenchmark]: {
    deviceId: string;
  };
  [ScreenName.DebugBLEDevicePairing]: {
    areKnownDevicesDisplayed: boolean;
    onSuccessAddToKnownDevices: boolean;
    filterByDeviceModelId?: FilterByDeviceModelId;
  };
  [ScreenName.DebugCrash]: undefined;
  [ScreenName.DebugStore]: undefined;
  [ScreenName.DebugEnv]: undefined;
  [ScreenName.DebugHttpTransport]: undefined;
  [ScreenName.DebugLogs]: undefined;
  [ScreenName.DebugLottie]: undefined;
  [ScreenName.DebugPlayground]: undefined;
  [ScreenName.DebugBluetoothAndLocationServices]: undefined;
  [ScreenName.DebugTermsOfUse]: undefined;
  [ScreenName.DebugVideos]: undefined;
  [ScreenName.DebugInstallSetOfApps]: undefined;
  [ScreenName.BenchmarkQRStream]: undefined;
  [ScreenName.OnboardingLanguage]: undefined;
  [ScreenName.PostOnboardingDebugScreen]: undefined;
  [ScreenName.DebugSnackbars]: undefined;
  [ScreenName.DebugTransactionsAlerts]: undefined;
  [ScreenName.DebugStoryly]: undefined;
  [ScreenName.DebugFetchCustomImage]: undefined;
  [ScreenName.DebugFirmwareUpdate]: undefined;
  [ScreenName.DebugCustomImageGraphics]: undefined;
  [ScreenName.DebugCameraPermissions]: undefined;
  [ScreenName.DebugQueuedDrawers]: undefined;
};
