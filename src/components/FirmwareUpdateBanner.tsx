import React, { useState, useEffect, useContext, useCallback } from "react";

import { StyleSheet, TouchableOpacity } from "react-native";
import manager from "@ledgerhq/live-common/lib/manager";
import * as Animatable from "react-native-animatable";
import { useNavigation, useTheme } from "@react-navigation/native";
import {
  DeviceModelInfo,
  FirmwareUpdateContext,
} from "@ledgerhq/live-common/lib/types/manager";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { ScreenName, NavigatorName } from "../const";
import { BottomDrawer, Notification } from "@ledgerhq/native-ui";
import {
  DownloadMedium,
  NanoFirmwareUpdateMedium,
} from "@ledgerhq/native-ui/assets/icons";
import ButtonUseTouchable from "../context/ButtonUseTouchable";
import {
  lastSeenDeviceSelector,
  hasCompletedOnboardingSelector,
} from "../reducers/settings";
import { hasConnectedDeviceSelector } from "../reducers/appstate";
import { BaseButton as Button } from "./Button";

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
  const useTouchable = useContext(ButtonUseTouchable);
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
  const onDismissBanner = () => {
    setShowBanner(false);
  };

  return showBanner && hasCompletedOnboarding ? (
    <>
      <Animatable.View
        animation="fadeInDownBig"
        easing="ease-out-expo"
        useNativeDriver
        style={styles.banner.root}
      >
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
          <Notification
            title={t("FirmwareUpdate.newVersion", { version })}
            onClose={onDismissBanner}
            Icon={NanoFirmwareUpdateMedium}
          />
        </TouchableOpacity>
      </Animatable.View>

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
          colors={colors}
          useTouchable={useTouchable}
          isFocused={true}
          onPress={onCloseDrawer}
        />
        <Button
          type="alert"
          title={"Or... do it here 😯"}
          colors={colors}
          useTouchable={useTouchable}
          isFocused={true}
          onPress={onExperimentalFirmwareUpdate}
        />
      </BottomDrawer>
    </>
  ) : null;
};

const styles = {
  banner: StyleSheet.create({
    root: {
      position: "absolute",
      width: "100%",
      top: 30,
      left: 0,
      zIndex: 100,
      padding: 16,
    },
  }),
};

export default FirmwareUpdateBanner;
