// @flow

import React, { useState, useEffect, useContext } from "react";

import {
  View,
  TouchableOpacity,
  TouchableHighlight,
  StyleSheet,
  Platform,
} from "react-native";
import manager from "@ledgerhq/live-common/lib/manager";
import * as Animatable from "react-native-animatable";
import { useTheme } from "@react-navigation/native";
import type {
  DeviceModelInfo,
  FirmwareUpdateContext,
} from "@ledgerhq/live-common/lib/types/manager";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import ButtonUseTouchable from "../context/ButtonUseTouchable";
import {
  lastSeenDeviceSelector,
  hasCompletedOnboardingSelector,
} from "../reducers/settings";
import { hasConnectedDeviceSelector } from "../reducers/appstate";
import IconExclamation from "../icons/ExclamationCircleFull";
import { BaseButton as Button } from "./Button";
import IconDownload from "../icons/Download";
import BottomModal from "./BottomModal";
import IconClose from "../icons/Close";
import IconNano from "../icons/NanoS";
import { rgba } from "../colors";
import LText from "./LText";

const FirmwareUpdateBanner = () => {
  const lastSeenDevice: DeviceModelInfo = useSelector(lastSeenDeviceSelector);
  const hasConnectedDevice = useSelector(hasConnectedDeviceSelector);
  const hasCompletedOnboarding: boolean = useSelector(
    hasCompletedOnboardingSelector,
  );
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [version, setVersion] = useState<string>("");

  const { colors } = useTheme();
  const { t } = useTranslation();
  const useTouchable = useContext(ButtonUseTouchable);

  useEffect(() => {
    async function getLatestFirmwareForDevice() {
      const fw: FirmwareUpdateContext = await manager.getLatestFirmwareForDevice(
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

  return showBanner && hasConnectedDevice && hasCompletedOnboarding ? (
    <>
      <Animatable.View
        animation="fadeInDownBig"
        easing="ease-out-expo"
        useNativeDriver
        style={styles.banner.root}
      >
        <TouchableHighlight
          style={[
            styles.banner.snack,
            {
              backgroundColor: colors.warning,
            },
          ]}
          underlayColor={colors.darkWarning}
          onPress={onPress}
        >
          <>
            <View style={styles.banner.iconContainer}>
              <IconNano color={colors.white} size={16} />
            </View>
            <LText
              semiBold
              style={[styles.banner.textContainer, { color: colors.white }]}
            >
              {t("FirmwareUpdate.newVersion", { version })}
            </LText>
            <View style={styles.banner.closeContainer}>
              <TouchableOpacity
                onPress={onDismissBanner}
                style={styles.banner.closeIcon}
              >
                <IconClose color={colors.white} size={16} />
              </TouchableOpacity>
            </View>
          </>
        </TouchableHighlight>
      </Animatable.View>

      <BottomModal
        style={[
          styles.drawer.root,
          {
            backgroundColor: colors.card,
          },
        ]}
        isOpened={showDrawer}
        onClose={onCloseDrawer}
      >
        <TouchableOpacity
          style={styles.drawer.closeIcon}
          onPress={onCloseDrawer}
        >
          <IconClose size={18} />
        </TouchableOpacity>

        <View
          style={[
            styles.drawer.roundIconContainer,
            {
              backgroundColor: rgba(colors.live, 0.15),
            },
          ]}
        >
          <IconDownload color={colors.live} size={30} />
          <IconExclamation style={styles.drawer.exclamationIcon} size={30} />
        </View>

        <LText semiBold style={[styles.drawer.textCenter, styles.drawer.title]}>
          {t("FirmwareUpdate.drawerUpdate.title")}
        </LText>
        <LText style={[styles.drawer.textCenter, styles.drawer.description]}>
          {t("FirmwareUpdate.drawerUpdate.description")}
        </LText>

        <View style={styles.drawer.buttonContainer}>
          <Button
            type="primary"
            title={t("common.close")}
            colors={colors}
            useTouchable={useTouchable}
            isFocused={true}
            onPress={onCloseDrawer}
          />
        </View>
      </BottomModal>
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
    snack: {
      display: "flex",
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 4,
      paddingVertical: 20,
      paddingHorizontal: 16,
      ...Platform.select({
        android: {
          elevation: 1,
        },
        ios: {
          shadowColor: "black",
          shadowOpacity: 0.14,
          shadowRadius: 2,
          shadowOffset: {
            width: 0,
            height: 4,
          },
        },
      }),
    },
    textContainer: {
      fontSize: 13,
      paddingLeft: 8,
      flex: 1,
    },
    iconContainer: {
      width: 16,
    },
    closeContainer: {
      width: 16,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    closeIcon: {
      position: "absolute",
      padding: 10,
    },
  }),
  drawer: StyleSheet.create({
    root: {
      paddingHorizontal: 16,
      paddingVertical: 30,
      position: "relative",
      alignItems: "center",
    },
    textCenter: {
      textAlign: "center",
    },
    closeIcon: {
      position: "absolute",
      top: 8,
      right: 16,
      opacity: 0.5,
    },
    roundIconContainer: {
      width: 70,
      height: 70,
      borderRadius: 35,
      marginBottom: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    exclamationIcon: {
      position: "absolute",
      top: -5,
      right: -5,
    },
    title: {
      marginBottom: 10,
      fontSize: 16,
    },
    description: {
      marginVertical: 8,
      opacity: 0.6,
      lineHeight: 20,
      marginBottom: 30,
    },
    buttonContainer: {
      marginTop: 30,
      width: "100%",
    },
  }),
};

export default FirmwareUpdateBanner;
