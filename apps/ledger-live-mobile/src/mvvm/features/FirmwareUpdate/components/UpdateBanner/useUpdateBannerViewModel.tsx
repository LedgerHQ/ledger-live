import { useState, useCallback } from "react";
import { Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
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

export function useUpdateBannerViewModel({
  onBackFromUpdate,
  fullWidth,
}: FirmwareUpdateBannerProps): ViewProps {
  const navigation = useNavigation<BaseNavigation>();

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

  const onClickUpdate = useCallback(() => {
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
    fullWidth,
  };
}
