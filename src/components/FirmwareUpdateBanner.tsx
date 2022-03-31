import React, { useState, useEffect, useContext, useCallback } from "react";
import { Platform } from "react-native";
import manager from "@ledgerhq/live-common/lib/manager";
import { useNavigation } from "@react-navigation/native";
import {
  DeviceModelInfo,
  FirmwareUpdateContext,
} from "@ledgerhq/live-common/lib/types/manager";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { ScreenName, NavigatorName } from "../const";
import { BottomDrawer, Flex, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components";
import { DownloadMedium } from "@ledgerhq/native-ui/assets/icons";

import {
  lastSeenDeviceSelector,
  hasCompletedOnboardingSelector,
} from "../reducers/settings";
import { hasConnectedDeviceSelector } from "../reducers/appstate";
import Button from "./Button";
import useEnv from "@ledgerhq/live-common/lib/hooks/useEnv";
import { useFeature } from "@ledgerhq/live-common/lib/featureFlags";

const FirmwareUpdateBanner = () => {
  const lastSeenDevice: DeviceModelInfo | null = useSelector(
    lastSeenDeviceSelector,
  );
  const hasConnectedDevice = useSelector(hasConnectedDeviceSelector);
  const hasCompletedOnboarding: boolean = useSelector(
    hasCompletedOnboardingSelector,
  );

  const navigation = useNavigation();
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [version, setVersion] = useState<string>("");

  const { colors } = useTheme();
  const { t } = useTranslation();

  const onExperimentalFirmwareUpdate = useCallback(() => {
    navigation.navigate(NavigatorName.Manager, {
      screen: ScreenName.Manager,
      params: { firmwareUpdate: true },
    });
    setShowDrawer(false);
  }, [navigation]);

  useEffect(() => {
    async function getLatestFirmwareForDevice() {
      const fw:
        | FirmwareUpdateContext
        | null
        | undefined = await manager.getLatestFirmwareForDevice(
        lastSeenDevice?.deviceInfo,
      );

      setShowBanner(Boolean(fw));
      setVersion(fw?.final?.name ?? "");
    }

    getLatestFirmwareForDevice();
  }, [lastSeenDevice, setShowBanner, setVersion]);

  const onPress = () => {
    setShowDrawer(true);
  };
  const onCloseDrawer = () => {
    setShowDrawer(false);
  };

  const usbFwUpdateExperimental = useEnv("USB_FW_UPDATE");
  const usbFwUpdateFeatureFlag = useFeature("llmUsbFirmwareUpdate");
  const usbFwUpdateActivated =
    (usbFwUpdateExperimental || usbFwUpdateFeatureFlag?.enabled) &&
    Platform.OS === "android";

  // TODO: use the correct checks below to display the banner
  // showBanner && hasCompletedOnboarding && hasConnectedDevice
  return true ? (
    <>
      <Flex
        mx={6}
        my={4}
        backgroundColor={colors.primary.c20}
        flexDirection="row"
        alignItems="center"
        p={6}
        borderRadius={5}
      >
        <Text flexShrink={1}>
          {t("FirmwareUpdate.newVersion", { version })}
        </Text>
        <Button
          ml={5}
          iconPosition="left"
          type="color"
          title={"Update"}
          onPress={usbFwUpdateActivated ? onExperimentalFirmwareUpdate : onPress}
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
