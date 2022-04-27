import React, { useState, useCallback } from "react";
import { Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { DeviceModelInfo } from "@ledgerhq/live-common/lib/types/manager";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { ScreenName, NavigatorName } from "../const";
import { BottomDrawer, Flex, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components";
import { DownloadMedium } from "@ledgerhq/native-ui/assets/icons";
import {
  lastSeenDeviceSelector,
  hasCompletedOnboardingSelector,
  lastConnectedDeviceSelector,
} from "../reducers/settings";
import { hasConnectedDeviceSelector } from "../reducers/appstate";
import Button from "./Button";
import useEnv from "@ledgerhq/live-common/lib/hooks/useEnv";
import { useFeature } from "@ledgerhq/live-common/lib/featureFlags";
import useLatestFirmware from "../hooks/useLatestFirmware";
import { gte as isVersionGreaterOrEqual } from "semver";
import { DeviceModelId } from "@ledgerhq/devices";
import { StackNavigationProp } from "@react-navigation/stack";

const deviceMinimumVersionsForUpdate: { [key in DeviceModelId]?: string } = {
  nanoS: "1.6.1",
  nanoX: "1.2.4-6",
  nanoSP: "1.0.0",
};

const FirmwareUpdateBanner = () => {
  const lastSeenDevice: DeviceModelInfo | null = useSelector(
    lastSeenDeviceSelector,
  );
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const hasConnectedDevice = useSelector(hasConnectedDeviceSelector);
  const hasCompletedOnboarding: boolean = useSelector(
    hasCompletedOnboardingSelector,
  );

  const [showDrawer, setShowDrawer] = useState<boolean>(false);

  const { colors } = useTheme();
  const { t } = useTranslation();

  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<any>>();

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
  }, [navigation]);

  const latestFirmware = useLatestFirmware(lastSeenDevice?.deviceInfo);
  const showBanner = Boolean(latestFirmware);
  const version = latestFirmware?.final?.name ?? "";

  const onPress = () => {
    setShowDrawer(true);
  };
  const onCloseDrawer = () => {
    setShowDrawer(false);
  };

  const usbFwUpdateExperimental = useEnv("USB_FW_UPDATE");
  const usbFwUpdateFeatureFlag = useFeature("llmUsbFirmwareUpdate");
  const isUsbFwUpdateFeatureActivated =
    usbFwUpdateExperimental || usbFwUpdateFeatureFlag?.enabled;
  const isUsbFwVersionUpdateSupported =
    lastSeenDevice &&
    deviceMinimumVersionsForUpdate[lastSeenDevice.modelId] &&
    isVersionGreaterOrEqual(
      lastSeenDevice.deviceInfo.version,
      deviceMinimumVersionsForUpdate[lastSeenDevice.modelId] as string,
    );
  const usbFwUpdateActivated =
    isUsbFwUpdateFeatureActivated &&
    Platform.OS === "android" &&
    lastConnectedDevice?.wired &&
    isUsbFwVersionUpdateSupported;

  return showBanner && hasCompletedOnboarding && hasConnectedDevice ? (
    <>
      <Flex
        backgroundColor={colors.primary.c20}
        flexDirection="row"
        alignItems="center"
        p={6}
        borderRadius={5}
      >
        {/* replace flex for Alert component */}
        <Text flexShrink={1}>
          {t("FirmwareUpdate.newVersion", { version })}
        </Text>
        <Button
          ml={5}
          event="FirmwareUpdateBannerClick"
          type="color"
          title={t("FirmwareUpdate.update")}
          onPress={
            usbFwUpdateActivated ? onExperimentalFirmwareUpdate : onPress
          }
          outline={false}
        />
      </Flex>

      <BottomDrawer
        isOpen={showDrawer}
        onClose={onCloseDrawer}
        Icon={DownloadMedium}
        title={t("FirmwareUpdate.drawerUpdate.title")}
        description={t("FirmwareUpdate.drawerUpdate.description")}
      >
        <Button
          type="primary"
          title={t("common.close")}
          onPress={onCloseDrawer}
        />
      </BottomDrawer>
    </>
  ) : null;
};

export default FirmwareUpdateBanner;
