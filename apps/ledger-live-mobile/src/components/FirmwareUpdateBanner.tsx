import React, { useState, useCallback } from "react";
import { Platform, Pressable } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Alert, Text, Flex, Icons } from "@ledgerhq/native-ui";
import { DownloadMedium, UsbMedium } from "@ledgerhq/native-ui/assets/icons";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { StackNavigationProp } from "@react-navigation/stack";
import isFirmwareUpdateVersionSupported from "@ledgerhq/live-common/hw/isFirmwareUpdateVersionSupported";
import useLatestFirmware from "@ledgerhq/live-common/hooks/useLatestFirmware";

import { ScreenName, NavigatorName } from "~/const";
import {
  lastSeenDeviceSelector,
  hasCompletedOnboardingSelector,
  lastConnectedDeviceSelector,
} from "~/reducers/settings";
import { hasConnectedDeviceSelector } from "~/reducers/appstate";
import Button from "./Button";
import QueuedDrawer from "./QueuedDrawer";
import { UpdateStep } from "~/screens/FirmwareUpdate";

export type FirmwareUpdateBannerProps = {
  onBackFromUpdate: (updateState: UpdateStep) => void;
};

const FirmwareUpdateBanner = ({ onBackFromUpdate }: FirmwareUpdateBannerProps) => {
  const lastSeenDevice: DeviceModelInfo | null | undefined = useSelector(lastSeenDeviceSelector);

  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const hasConnectedDevice = useSelector(hasConnectedDeviceSelector);
  const hasCompletedOnboarding: boolean = useSelector(hasCompletedOnboardingSelector);

  const [showUnsupportedUpdateDrawer, setShowUnsupportedUpdateDrawer] = useState<boolean>(false);

  const { t } = useTranslation();

  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<Record<string, object | undefined>>>();

  const newFwUpdateUxFeatureFlag = useFeature("llmNewFirmwareUpdateUx");

  const latestFirmware = useLatestFirmware(lastSeenDevice?.deviceInfo);

  const onExperimentalFirmwareUpdate = useCallback(() => {
    if (newFwUpdateUxFeatureFlag?.enabled) {
      navigation.navigate(NavigatorName.Manager, {
        screen: ScreenName.FirmwareUpdate,
        params: {
          device: lastConnectedDevice,
          deviceInfo: lastSeenDevice?.deviceInfo,
          firmwareUpdateContext: latestFirmware,
          onBackFromUpdate,
        },
      });
      return;
    }

    // if we're already in the manager page, only update the params
    if (route.name === ScreenName.ManagerMain) {
      navigation.setParams({ firmwareUpdate: true });
    } else {
      navigation.navigate(NavigatorName.Manager, {
        screen: ScreenName.Manager,
        params: { firmwareUpdate: true },
      });
    }

    setShowUnsupportedUpdateDrawer(false);
  }, [
    newFwUpdateUxFeatureFlag?.enabled,
    route.name,
    navigation,
    lastConnectedDevice,
    lastSeenDevice?.deviceInfo,
    latestFirmware,
    onBackFromUpdate,
  ]);

  const showBanner = Boolean(latestFirmware);
  const version = latestFirmware?.final?.name ?? "";

  const onCloseUsbWarningDrawer = useCallback(() => {
    setShowUnsupportedUpdateDrawer(false);
  }, []);

  const isUsbFwVersionUpdateSupported =
    lastSeenDevice &&
    isFirmwareUpdateVersionSupported(lastSeenDevice.deviceInfo, lastSeenDevice.modelId);

  const wiredDevice = lastConnectedDevice?.wired === true;

  const usbFwUpdateActivated = Platform.OS === "android" && isUsbFwVersionUpdateSupported;

  const fwUpdateActivatedButNotWired = usbFwUpdateActivated && !wiredDevice;

  const onClickUpdate = useCallback(() => {
    // Path with Stax and the new firmware update flow (can be BLE or wired)
    if (lastConnectedDevice?.modelId === DeviceModelId.stax && newFwUpdateUxFeatureFlag?.enabled) {
      // This leads to a check on the battery before triggering update, it is only necessary for Stax and on the new UX
      // (because it's the only type of update that can happen via BLE)
      // setLoading(true);
      // triggerBatteryCheck();
      onExperimentalFirmwareUpdate();
    }
    // Path with any device model, wired and on android
    else if (isUsbFwVersionUpdateSupported && wiredDevice && Platform.OS === "android") {
      onExperimentalFirmwareUpdate();
    } else {
      setShowUnsupportedUpdateDrawer(true);
    }
  }, [
    lastConnectedDevice?.modelId,
    newFwUpdateUxFeatureFlag?.enabled,
    isUsbFwVersionUpdateSupported,
    wiredDevice,
    onExperimentalFirmwareUpdate,
  ]);

  const productName = lastConnectedDevice
    ? getDeviceModel(lastConnectedDevice.modelId).productName
    : undefined;

  const deviceName = lastConnectedDevice?.deviceName;

  return showBanner && hasCompletedOnboarding && hasConnectedDevice ? (
    <>
      {newFwUpdateUxFeatureFlag?.enabled ? (
        <Pressable onPress={onClickUpdate}>
          <Flex
            flexDirection="row"
            alignItems="flex-start"
            backgroundColor="opacityDefault.c05"
            borderRadius={12}
            p={7}
            pl={5}
          >
            <Flex flexDirection="row" alignItems="center" mb={5} mr={4}>
              {lastConnectedDevice?.modelId === DeviceModelId.stax ? (
                <Icons.Stax color="primary.c80" size="M" />
              ) : (
                <Icons.Nano color="primary.c80" size="M" />
              )}
            </Flex>
            <Flex flexDirection="column" alignItems={"flex-start"} flexShrink={1}>
              <Text variant="h5" fontWeight="semiBold" pb={4}>
                {t("FirmwareUpdate.banner.title")}
              </Text>
              <Text variant="paragraph" fontWeight="medium" color="opacityDefault.c70">
                {deviceName
                  ? t("FirmwareUpdate.banner.descriptionDeviceName", {
                      deviceName,
                      firmwareVersion: version,
                    })
                  : t("FirmwareUpdate.banner.descriptionProductName", {
                      productName,
                      firmwareVersion: version,
                    })}
              </Text>
            </Flex>
          </Flex>
        </Pressable>
      ) : (
        <Flex mt={5}>
          <Alert type="info" showIcon={false}>
            <Text flexShrink={1} flexGrow={1}>
              {t("FirmwareUpdate.newVersion", {
                version,
                deviceName,
              })}
            </Text>
            <Button
              ml={5}
              event="button_clicked"
              eventProperties={{ button: "Update" }}
              type="color"
              title={t("FirmwareUpdate.update")}
              onPress={onClickUpdate}
              outline={false}
            />
          </Alert>
        </Flex>
      )}

      <QueuedDrawer
        isRequestingToBeOpened={showUnsupportedUpdateDrawer}
        onClose={onCloseUsbWarningDrawer}
        Icon={fwUpdateActivatedButNotWired ? UsbMedium : DownloadMedium}
        title={
          fwUpdateActivatedButNotWired
            ? t("FirmwareUpdate.drawerUpdate.pleaseConnectUsbTitle")
            : t("FirmwareUpdate.drawerUpdate.title")
        }
        description={
          fwUpdateActivatedButNotWired
            ? t("FirmwareUpdate.drawerUpdate.pleaseConnectUsbDescription", {
                deviceName,
              })
            : t("FirmwareUpdate.drawerUpdate.description")
        }
        noCloseButton
      >
        <Button type="primary" title={t("common.close")} onPress={onCloseUsbWarningDrawer} />
      </QueuedDrawer>
    </>
  ) : null;
};

export default FirmwareUpdateBanner;
