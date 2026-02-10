import { useState, useCallback, useRef, useEffect } from "react";
import { Platform } from "react-native";
import { useNavigation, useRoute, useIsFocused } from "@react-navigation/native";
import { useSelector } from "~/context/hooks";
import { useLatestFirmware } from "@ledgerhq/live-common/device/hooks/useLatestFirmware";
import {
  lastSeenDeviceSelector,
  hasCompletedOnboardingSelector,
  lastConnectedDeviceSelector,
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
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { track } from "~/analytics";

export function useUpdateBannerViewModel({
  onBackFromUpdate,
}: FirmwareUpdateBannerProps): ViewProps {
  const navigation = useNavigation<BaseNavigation>();
  const isFocused = useIsFocused();

  const lastSeenDeviceModelInfo = useSelector(lastSeenDeviceSelector);
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const hasConnectedDevice = useSelector(hasConnectedDeviceSelector);
  const hasCompletedOnboarding: boolean = useSelector(hasCompletedOnboardingSelector);
  const latestFirmware = useLatestFirmware(lastSeenDeviceModelInfo?.deviceInfo);

  const bannerVisible = Boolean(latestFirmware) && hasCompletedOnboarding && hasConnectedDevice;
  const version = latestFirmware?.final?.name ?? "";
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

  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("mobile");
  const route = useRoute();
  const isInMyLedgerDeviceScreen = route.name === ScreenName.MyLedgerDevice;

  const impressionTracked = useRef(false);
  useEffect(() => {
    if (!shouldDisplayWallet40MainNav || !isFocused || impressionTracked.current) return;
    impressionTracked.current = true;
    track("banner_impression", {
      banner: "OS update",
      page: isInMyLedgerDeviceScreen ? "my ledger" : "portfolio",
    });
  }, [shouldDisplayWallet40MainNav, isInMyLedgerDeviceScreen, isFocused]);

  const onClickUpdate = useCallback(() => {
    if (shouldDisplayWallet40MainNav) {
      track("button_clicked", {
        page: isInMyLedgerDeviceScreen ? "my ledger" : "portfolio",
        banner: "OS update",
        button: "click(update)",
      });
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
    isNewUxSupported,
    isInMyLedgerDeviceScreen,
    lastConnectedDevice,
    lastSeenDeviceModelInfo,
    latestFirmware,
    navigation,
    onBackFromUpdate,
    bleUpdateSupported,
    connectionType,
    shouldDisplayWallet40MainNav,
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
    shouldDisplayWallet40MainNav,
    isInMyLedgerDeviceScreen,
  };
}
