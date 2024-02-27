import { useState, useCallback } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { StackNavigationProp } from "@react-navigation/stack";
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
  isNewFirmwareUpdateUxSupported,
  isOldFirmwareUpdateUxSupported,
} from "../../utils/isFirmwareUpdateSupported";
import { navigateToNewUpdateFlow } from "../../utils/navigateToNewUpdateFlow";
import { navigateToOldUpdateFlow } from "../../utils/navigateToOldUpdateFlow";

export function useUpdateBannerViewModel({
  onBackFromUpdate,
}: FirmwareUpdateBannerProps): ViewProps {
  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<Record<string, object | undefined>>>();

  const lastSeenDeviceModelInfo = useSelector(lastSeenDeviceSelector);
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const hasConnectedDevice = useSelector(hasConnectedDeviceSelector);
  const hasCompletedOnboarding: boolean = useSelector(hasCompletedOnboardingSelector);
  const latestFirmware = useLatestFirmware(lastSeenDeviceModelInfo?.deviceInfo);

  const bannerVisible = Boolean(latestFirmware) && hasCompletedOnboarding && hasConnectedDevice;
  const version = latestFirmware?.final?.name ?? "";

  const {
    updateSupported: isOldUxSupported,
    updateSupportedButDeviceNotWired: isOldUxSupportedButDeviceNotWired,
  } = isOldFirmwareUpdateUxSupported({
    lastSeenDeviceModelInfo,
    lastConnectedDevice,
  });
  const isNewUxSupported = isNewFirmwareUpdateUxSupported(lastConnectedDevice?.modelId);

  const [unsupportedUpdateDrawerOpened, setUnsupportedUpdateDrawerOpened] =
    useState<boolean>(false);
  const closeUnsupportedUpdateDrawer = useCallback(() => {
    setUnsupportedUpdateDrawerOpened(false);
  }, []);

  const onClickUpdate = useCallback(() => {
    if (isNewUxSupported) {
      navigateToNewUpdateFlow({
        navigation,
        lastConnectedDevice,
        lastSeenDeviceModelInfo,
        latestFirmware,
        onBackFromUpdate,
      });
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
  ]);

  return {
    bannerVisible,
    version,
    lastConnectedDevice,
    onClickUpdate,
    unsupportedUpdateDrawerOpened,
    closeUnsupportedUpdateDrawer,
    isUpdateSupportedButDeviceNotWired: isOldUxSupportedButDeviceNotWired,
  };
}
