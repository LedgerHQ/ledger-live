import { useState, useCallback } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { DeviceModelInfo } from "@ledgerhq/types-live";
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
import { navigateToFirmwareUpdateFlow } from "../../utils/navigateToFirmwareUpdateFlow";
import { ViewProps } from "./ViewProps";
import {
  isNewFirmwareUpdateUxSupported,
  isOldFirmwareUpdateUxSupported,
} from "../../utils/isFirmwareUpdateSupported";

export function useFirmwareUpdateBannerViewModel({
  onBackFromUpdate,
}: FirmwareUpdateBannerProps): ViewProps {
  const lastSeenDeviceModelInfo: DeviceModelInfo | null | undefined =
    useSelector(lastSeenDeviceSelector);
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const hasConnectedDevice = useSelector(hasConnectedDeviceSelector);
  const hasCompletedOnboarding: boolean = useSelector(hasCompletedOnboardingSelector);

  const [unsupportedUpdateDrawerOpened, setUnsupportedUpdateDrawerOpened] =
    useState<boolean>(false);

  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<Record<string, object | undefined>>>();

  const latestFirmware = useLatestFirmware(lastSeenDeviceModelInfo?.deviceInfo);

  const startFirmwareUpdateFlow = useCallback(() => {
    navigateToFirmwareUpdateFlow({
      lastConnectedDevice,
      lastSeenDeviceModelInfo: lastSeenDeviceModelInfo,
      latestFirmware,
      route,
      navigation,
      onBackFromUpdate,
    });
  }, [
    lastConnectedDevice,
    lastSeenDeviceModelInfo,
    latestFirmware,
    navigation,
    onBackFromUpdate,
    route,
  ]);

  const showBanner = Boolean(latestFirmware) && hasCompletedOnboarding && hasConnectedDevice;
  const version = latestFirmware?.final?.name ?? "";

  const closeUnsupportedUpdateDrawer = useCallback(() => {
    setUnsupportedUpdateDrawerOpened(false);
  }, []);

  const {
    isSupported: isOldUxSupported,
    isSupportedButDeviceNotWired: isOldUxSupportedButDeviceNotWired,
  } = isOldFirmwareUpdateUxSupported({
    lastSeenDeviceModelInfo,
    lastConnectedDevice,
  });
  const isNewUxSupported = isNewFirmwareUpdateUxSupported(lastConnectedDevice?.modelId);

  const onClickUpdate = useCallback(() => {
    if (isNewUxSupported || isOldUxSupported) {
      startFirmwareUpdateFlow();
      setUnsupportedUpdateDrawerOpened(false);
    } else {
      setUnsupportedUpdateDrawerOpened(true);
    }
  }, [isNewUxSupported, isOldUxSupported, startFirmwareUpdateFlow]);

  return {
    showBanner,
    lastConnectedDevice,
    version,
    onClickUpdate,
    unsupportedUpdateDrawerOpened,
    closeUnsupportedUpdateDrawer,
    isUpdateSupportedButDeviceNotWired: isOldUxSupportedButDeviceNotWired,
  };
}
