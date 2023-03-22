import React, { useState, useCallback } from "react";
import { Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Alert, Text, Flex } from "@ledgerhq/native-ui";
import { DownloadMedium, UsbMedium } from "@ledgerhq/native-ui/assets/icons";
import { getDeviceModel } from "@ledgerhq/devices";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { StackNavigationProp } from "@react-navigation/stack";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import isFirmwareUpdateVersionSupported from "@ledgerhq/live-common/hw/isFirmwareUpdateVersionSupported";
import useLatestFirmware from "@ledgerhq/live-common/hooks/useLatestFirmware";
import { ScreenName, NavigatorName } from "../const";
import {
  lastSeenDeviceSelector,
  hasCompletedOnboardingSelector,
  lastConnectedDeviceSelector,
} from "../reducers/settings";
import {
  getWiredDeviceSelector,
  hasConnectedDeviceSelector,
} from "../reducers/appstate";
import Button from "./Button";
import QueuedDrawer from "./QueuedDrawer";

const FirmwareUpdateBanner = ({
  containerProps,
}: {
  containerProps?: FlexBoxProps;
}) => {
  const lastSeenDevice: DeviceModelInfo | null | undefined = useSelector(
    lastSeenDeviceSelector,
  );
  const wiredDevice = useSelector(getWiredDeviceSelector);
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

  const usbFwUpdateActivated =
    usbFwUpdateFeatureFlag?.enabled &&
    Platform.OS === "android" &&
    isUsbFwVersionUpdateSupported;

  const fwUpdateActivatedButNotWired = usbFwUpdateActivated && !wiredDevice;

  const deviceName = lastConnectedDevice
    ? getDeviceModel(lastConnectedDevice.modelId).productName
    : "";

  return showBanner && hasCompletedOnboarding && hasConnectedDevice ? (
    <Flex mt={5} {...containerProps}>
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
            usbFwUpdateActivated && wiredDevice
              ? onExperimentalFirmwareUpdate
              : onPress
          }
          outline={false}
        />
      </Alert>

      <QueuedDrawer
        isRequestingToBeOpened={showDrawer}
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
      </QueuedDrawer>
    </Flex>
  ) : null;
};

export default FirmwareUpdateBanner;
