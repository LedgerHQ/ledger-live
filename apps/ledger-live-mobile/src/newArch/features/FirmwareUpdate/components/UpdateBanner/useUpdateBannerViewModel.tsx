import { useState, useCallback } from "react";
import { Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useLatestFirmware } from "@ledgerhq/live-common/device/hooks/useLatestFirmware";
import { DeviceModelId } from "@ledgerhq/devices";
import semver from "semver";
import {
  lastSeenDeviceSelector,
  hasCompletedOnboardingSelector,
  lastConnectedDeviceSelector,
} from "~/reducers/settings";
import { hasConnectedDeviceSelector } from "~/reducers/appstate";
import { FirmwareUpdateBannerProps } from ".";
import type { ViewProps } from "./ViewProps";
import {
  isNewFirmwareUpdateUxSupported,
  isOldFirmwareUpdateUxSupported,
} from "../../utils/isFirmwareUpdateSupported";
import { navigateToNewUpdateFlow } from "../../utils/navigateToNewUpdateFlow";
import { navigateToOldUpdateFlow } from "../../utils/navigateToOldUpdateFlow";
import { BaseNavigation } from "~/components/RootNavigator/types/helpers";

export function useUpdateBannerViewModel({
  onBackFromUpdate,
}: FirmwareUpdateBannerProps): ViewProps {
  const route = useRoute();
  const navigation = useNavigation<BaseNavigation>();

  const lastSeenDeviceModelInfo = useSelector(lastSeenDeviceSelector);
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const hasConnectedDevice = useSelector(hasConnectedDeviceSelector);
  const hasCompletedOnboarding: boolean = useSelector(hasCompletedOnboardingSelector);
  const latestFirmware = useLatestFirmware(lastSeenDeviceModelInfo?.deviceInfo);

  const bannerVisible = Boolean(latestFirmware) && hasCompletedOnboarding && hasConnectedDevice;
  const version = latestFirmware?.final?.name ?? "";
  const connectionType = lastConnectedDevice?.wired ? "usb" : "bluetooth";

  const {
    updateSupported: isOldUxSupported,
    updateSupportedButDeviceNotWired: isOldUxSupportedButDeviceNotWired,
  } = isOldFirmwareUpdateUxSupported({
    lastSeenDeviceModelInfo,
    lastConnectedDevice,
  });
  const isNewUxSupported = isNewFirmwareUpdateUxSupported(
    lastConnectedDevice,
    lastSeenDeviceModelInfo,
  );

  const [unsupportedUpdateDrawerOpened, setUnsupportedUpdateDrawerOpened] =
    useState<boolean>(false);
  const closeUnsupportedUpdateDrawer = useCallback(() => {
    setUnsupportedUpdateDrawerOpened(false);
  }, []);

  const onClickUpdate = useCallback(() => {
    if (isNewUxSupported) {
      if (
        connectionType === "bluetooth" &&
        lastConnectedDevice?.modelId === DeviceModelId.nanoX &&
        lastSeenDeviceModelInfo?.deviceInfo.version &&
        semver.lt(lastSeenDeviceModelInfo?.deviceInfo.version, "2.4.0")
      ) {
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
    } else if (isOldUxSupported) {
      navigateToOldUpdateFlow({ route, navigation });
    } else {
      setUnsupportedUpdateDrawerOpened(true);
    }
  }, [
    isNewUxSupported,
    isOldUxSupported,
    lastConnectedDevice,
    lastSeenDeviceModelInfo,
    latestFirmware,
    navigation,
    onBackFromUpdate,
    route,
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
      isOldUxSupportedButDeviceNotWired ||
      (connectionType === "bluetooth" &&
        Platform.OS === "android" &&
        !!lastSeenDeviceModelInfo &&
        lastConnectedDevice?.deviceId === DeviceModelId.nanoX &&
        semver.lt(lastSeenDeviceModelInfo?.deviceInfo.version, "2.4.0")),
  };
}
