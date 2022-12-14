import React, { useState, useCallback } from "react";
import { Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Alert, BottomDrawer, Text, Flex } from "@ledgerhq/native-ui";
import { DownloadMedium, UsbMedium } from "@ledgerhq/native-ui/assets/icons";
import { getDeviceModel } from "@ledgerhq/devices";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { StackNavigationProp } from "@react-navigation/stack";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex";
import isFirmwareUpdateVersionSupported from "@ledgerhq/live-common/hw/isFirmwareUpdateVersionSupported";
import { ScreenName, NavigatorName } from "../const";
import {
  lastSeenDeviceSelector,
  hasCompletedOnboardingSelector,
  lastConnectedDeviceSelector,
} from "../reducers/settings";
import { hasConnectedDeviceSelector } from "../reducers/appstate";
import Button from "./Button";
import useLatestFirmware from "../hooks/useLatestFirmware";

const FirmwareUpdateBanner = ({
  containerProps,
}: {
  containerProps?: FlexBoxProps;
}) => {
  const lastSeenDevice: DeviceModelInfo | null | undefined = useSelector(
    lastSeenDeviceSelector,
  );
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const hasConnectedDevice = useSelector(hasConnectedDeviceSelector);
  const hasCompletedOnboarding: boolean = useSelector(
    hasCompletedOnboardingSelector,
  );

  const [showDrawer, setShowDrawer] = useState<boolean>(false);

  const { t } = useTranslation();

  const route = useRoute();
  const navigation =
    useNavigation<StackNavigationProp<Record<string, object | undefined>>>();

  const onExperimentalFirmwareUpdate = useCallback(() => {
    // if we're already in the manager page, only update the params
    if (route.name === ScreenName.ManagerMain) {
      navigation.setParams({ firmwareUpdate: true });
    } else {
      navigation.navigate(NavigatorName.Manager, {
        screen: ScreenName.Manager,
        params: { firmwareUpdate: true },
      });
    }

    setShowDrawer(false);
  }, [navigation, route.name]);

  const latestFirmware = useLatestFirmware(lastSeenDevice?.deviceInfo);
  const showBanner = Boolean(latestFirmware);
  const version = latestFirmware?.final?.name ?? "";

  const onPress = () => {
    setShowDrawer(true);
  };
  const onCloseDrawer = () => {
    setShowDrawer(false);
  };

  const usbFwUpdateFeatureFlag = useFeature("llmUsbFirmwareUpdate");
  const isUsbFwVersionUpdateSupported =
    lastSeenDevice &&
    isFirmwareUpdateVersionSupported(
      lastSeenDevice.deviceInfo,
      lastSeenDevice.modelId,
    );
  const isDeviceConnectedViaUSB = lastConnectedDevice?.wired === true;
  const usbFwUpdateActivated =
    usbFwUpdateFeatureFlag?.enabled &&
    Platform.OS === "android" &&
    isUsbFwVersionUpdateSupported;

  const fwUpdateActivatedButNotWired =
    usbFwUpdateActivated && !isDeviceConnectedViaUSB;

  const deviceName = lastConnectedDevice
    ? getDeviceModel(lastConnectedDevice.modelId).productName
    : "";

  return showBanner && hasCompletedOnboarding && hasConnectedDevice ? (
    <Flex mt={8} {...containerProps}>
      <Alert type="info" showIcon={false}>
        <Text flexShrink={1} flexGrow={1}>
          {t("FirmwareUpdate.newVersion", {
            version,
            deviceName,
          })}
        </Text>
        <Button
          ml={5}
          event="FirmwareUpdateBannerClick"
          type="color"
          title={t("FirmwareUpdate.update")}
          onPress={
            usbFwUpdateActivated && isDeviceConnectedViaUSB
              ? onExperimentalFirmwareUpdate
              : onPress
          }
          outline={false}
        />
      </Alert>

      <BottomDrawer
        isOpen={showDrawer}
        onClose={onCloseDrawer}
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
        <Button
          type="primary"
          title={t("common.close")}
          onPress={onCloseDrawer}
        />
      </BottomDrawer>
    </Flex>
  ) : null;
};

export default FirmwareUpdateBanner;
