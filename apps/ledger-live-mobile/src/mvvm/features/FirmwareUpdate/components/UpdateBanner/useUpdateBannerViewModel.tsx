import { track } from "@shared/analytics";
import { useState, useCallback, useRef } from "react";
import { Platform } from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSelector } from "~/context/hooks";
import { useLatestFirmware } from "@ledgerhq/live-common/device/hooks/useLatestFirmware";
import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import {
  lastSeenDeviceSelector,
  hasCompletedOnboardingSelector,
  lastConnectedDeviceSelector,
  debugOsUpdateBannerModeSelector,
} from "~/reducers/settings";
import { hasConnectedDeviceSelector } from "~/reducers/appstate";
import { FirmwareUpdateBannerProps } from ".";
import type { ViewProps } from "./ViewProps";
import {
  isBleUpdateSupported,
  isNewFirmwareUpdateUxSupported,
} from "../../utils/isFirmwareUpdateSupported";
import { navigateToNewUpdateFlow } from "../../utils/navigateToNewUpdateFlow";
import { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { osUpdatesSelector } from "LLM/features/OsUpdate/state/osUpdateSlice";
import { navigateToMyLedger } from "LLM/features/OsUpdate/utils/myLedgerNavigation";

export function useUpdateBannerViewModel({
  onBackFromUpdate,
}: FirmwareUpdateBannerProps): ViewProps {
  const navigation = useNavigation<BaseNavigation>();

  const lastSeenDeviceModelInfo = useSelector(lastSeenDeviceSelector);
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const hasConnectedDevice = useSelector(hasConnectedDeviceSelector);
  const hasCompletedOnboarding: boolean = useSelector(hasCompletedOnboardingSelector);

  const isOsUpdatesEnabled = useFeature("ldmkOsUpdates")?.enabled ?? false;
  const { shouldDisplayMyWallet } = useWalletFeaturesConfig("mobile");
  const latestOsUpdate = useSelector(osUpdatesSelector).at(-1);
  // With ldmkOsUpdates, the updates come from the OS update path resolved when connecting to My Ledger.
  const latestFirmware = useLatestFirmware(
    isOsUpdatesEnabled ? null : lastSeenDeviceModelInfo?.deviceInfo,
  );

  // Debug override (Settings > Debug > Features): force-show a banner variant.
  const debugBannerMode = useSelector(debugOsUpdateBannerModeSelector);

  const hasUpdate = isOsUpdatesEnabled ? Boolean(latestOsUpdate) : Boolean(latestFirmware);
  const bannerVisible =
    debugBannerMode !== "off" || (hasUpdate && hasCompletedOnboarding && hasConnectedDevice);
  // Mock version for the debug-forced banner.
  const latestVersion = isOsUpdatesEnabled
    ? latestOsUpdate?.finalFirmware.version
    : latestFirmware?.final?.name;
  const version = latestVersion ?? (debugBannerMode !== "off" ? "1.1.1" : "");
  const connectionType = lastConnectedDevice?.wired ? "usb" : "bluetooth";

  const isNewUxSupported = isNewFirmwareUpdateUxSupported(
    lastConnectedDevice,
    lastSeenDeviceModelInfo,
  );

  const bleUpdateSupported = isBleUpdateSupported(lastConnectedDevice, lastSeenDeviceModelInfo);

  const [unsupportedUpdateDrawerOpened, setUnsupportedUpdateDrawerOpened] =
    useState<boolean>(false);
  const closeUnsupportedUpdateDrawer = useCallback(() => {
    setUnsupportedUpdateDrawerOpened(false);
  }, []);

  const route = useRoute();
  const isInMyLedgerDeviceScreen = route.name === ScreenName.MyLedgerDevice;

  const impressionTracked = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (impressionTracked.current) return;
      impressionTracked.current = true;
      track("banner_impression", {
        banner: "OS update",
        page: isInMyLedgerDeviceScreen ? "my ledger" : "portfolio",
      });
    }, [isInMyLedgerDeviceScreen]),
  );

  const onClickUpdate = useCallback(() => {
    track("button_clicked", {
      page: isInMyLedgerDeviceScreen ? "my ledger" : "portfolio",
      banner: "OS update",
      button: "click(update)",
    });

    if (isOsUpdatesEnabled) {
      if (!lastConnectedDevice) return;
      if (isInMyLedgerDeviceScreen) {
        navigation.navigate(ScreenName.OsUpdate, { device: lastConnectedDevice });
      } else {
        // My Ledger reconnects the device, resolves the updates and opens the "What's new".
        navigateToMyLedger(navigation, {
          device: lastConnectedDevice,
          shouldDisplayMyWallet,
          firmwareUpdate: true,
        });
      }
      return;
    }

    if (isNewUxSupported) {
      if (connectionType === "bluetooth" && !bleUpdateSupported) {
        setUnsupportedUpdateDrawerOpened(true);
      } else {
        navigateToNewUpdateFlow({
          navigation,
          lastConnectedDevice,
          lastSeenDeviceModelInfo,
          latestFirmware,
          onBackFromUpdate,
        });
      }
    } else {
      setUnsupportedUpdateDrawerOpened(true);
    }
  }, [
    isOsUpdatesEnabled,
    shouldDisplayMyWallet,
    isNewUxSupported,
    isInMyLedgerDeviceScreen,
    lastConnectedDevice,
    lastSeenDeviceModelInfo,
    latestFirmware,
    navigation,
    onBackFromUpdate,
    bleUpdateSupported,
    connectionType,
  ]);

  return {
    bannerVisible,
    version,
    lastConnectedDevice,
    onClickUpdate,
    unsupportedUpdateDrawerOpened,
    closeUnsupportedUpdateDrawer,
    isUpdateSupportedButDeviceNotWired:
      Platform.OS === "android" && isNewUxSupported && !bleUpdateSupported,
    isInMyLedgerDeviceScreen,
    debugBannerMode,
  };
}
