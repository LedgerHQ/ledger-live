import React, { memo, useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { StyleSheet, View, Image, Linking } from "react-native";
import { Trans } from "react-i18next";

import type { State, AppsDistribution } from "@ledgerhq/live-common/lib/apps";
import Config from "react-native-config";

import manager from "@ledgerhq/live-common/lib/manager";

import { useTheme } from "@react-navigation/native";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import Genuine from "../../../icons/Genuine";
import FirmwareUpdateModal from "../Modals/FirmwareUpdateModal";
import DeviceAppStorage from "./DeviceAppStorage";

import nanoSLight from "./images/light/nanoS.png";
import nanoSPLight from "./images/light/nanoSP.png";
import nanoXLight from "./images/light/nanoX.png";
import blueLight from "./images/light/blue.png";
import nanoSDark from "./images/dark/nanoS.png";
import nanoSPDark from "./images/dark/nanoSP.png";
import nanoXDark from "./images/dark/nanoX.png";
import blueDark from "./images/dark/blue.png";

import { urls } from "../../../config/urls";
import Card from "../../../components/Card";

import DeviceName from "./DeviceName";
import { setAvailableUpdate } from "../../../actions/settings";

const illustrations = {
  dark: {
    nanoS: nanoSDark,
    nanoSP: nanoSPDark,
    nanoX: nanoXDark,
    blue: blueDark,
  },
  light: {
    nanoS: nanoSLight,
    nanoSP: nanoSPLight,
    nanoX: nanoXLight,
    blue: blueLight,
  },
};

type Props = {
  distribution: AppsDistribution,
  state: State,
  deviceId: string,
  initialDeviceName: string,
  blockNavigation: boolean,
  deviceInfo: *,
};

const DeviceCard = ({
  distribution,
  state,
  deviceId,
  initialDeviceName,
  blockNavigation,
  deviceInfo,
}: Props) => {
  const { colors, dark } = useTheme();
  const theme = dark ? "dark" : "light";
  const { deviceModel } = state;
  const [firmware, setFirmware] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const dispatch = useDispatch();

  const open = useCallback(() => setOpenModal(true), [setOpenModal]);
  const close = useCallback(() => setOpenModal(false), [setOpenModal]);
  const openSupport = useCallback(() => Linking.openURL(urls.contact), []);

  useEffect(() => {
    async function getLatestFirmwareForDevice() {
      const fw = await manager.getLatestFirmwareForDevice(deviceInfo);

      if (fw) {
        dispatch(setAvailableUpdate(true));
        setFirmware(fw);
      } else {
        dispatch(setAvailableUpdate(false));
        setFirmware(null);
      }
    }

    getLatestFirmwareForDevice();
  }, [deviceInfo, dispatch]);

  const isDeprecated = manager.firmwareUnsupported(deviceModel.id, deviceInfo);

  return (
    <>
      <Card style={styles.card}>
        {firmware ? (
          <View style={styles.firmwareBanner}>
            <LText primary semiBold style={styles.firmwareBannerText}>
              <Trans
                i18nKey="manager.firmware.latest"
                values={{ version: firmware.final.name }}
              />
            </LText>
            <View style={styles.firmwareBannerCTA}>
              <Button
                type="primary"
                title={<Trans i18nKey="common.moreInfo" />}
                onPress={open}
              />
            </View>
          </View>
        ) : isDeprecated ? (
          <View
            style={[
              styles.firmwareBanner,
              { backgroundColor: colors.lightLive },
            ]}
          >
            <LText
              primary
              semiBold
              style={styles.firmwareBannerText}
              color="live"
            >
              <Trans i18nKey="manager.firmware.outdated" />
            </LText>
            <View style={styles.firmwareBannerCTA}>
              <Button
                type="primary"
                title={<Trans i18nKey="common.contactUs" />}
                onPress={openSupport}
              />
            </View>
          </View>
        ) : null}
        <View style={styles.deviceSection}>
          <View style={styles.deviceImageContainer}>
            <Image
              style={styles.deviceImage}
              source={
                illustrations[theme][Config.OVERRIDE_MODEL_ID || deviceModel.id]
              }
              resizeMode="cover"
            />
          </View>
          <View style={styles.deviceInfoContainer}>
            <View style={styles.deviceNameContainer}>
              <DeviceName
                deviceId={deviceId}
                deviceModel={deviceModel}
                initialDeviceName={initialDeviceName}
                disabled={blockNavigation}
              />
            </View>

            <LText style={styles.deviceFirmware} color="grey">
              <Trans
                i18nKey="FirmwareVersionRow.subtitle"
                values={{ version: deviceInfo.version }}
              />
            </LText>
            <View style={styles.deviceCapacity}>
              <LText style={styles.deviceFirmware} color="grey">
                <Trans i18nKey="manager.storage.genuine" />
              </LText>
              <Genuine />
            </View>
          </View>
        </View>
        <View
          style={[styles.separator, { backgroundColor: colors.lightFog }]}
        />
        <View style={styles.storageSection}>
          <DeviceAppStorage
            distribution={distribution}
            deviceModel={deviceModel}
            deviceInfo={deviceInfo}
          />
        </View>
      </Card>
      <FirmwareUpdateModal isOpened={openModal} onClose={close} />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 265,
    flexDirection: "column",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  capacityText: { fontSize: 13 },
  deviceSection: {
    height: 119,
    flexDirection: "row",
  },
  deviceImageContainer: {
    flexBasis: 41,
    flexDirection: "column",
    paddingVertical: 20,
    paddingHorizontal: 0,
    alignItems: "center",
  },
  deviceImage: {
    flex: 1,
    width: "100%",
  },
  deviceInfoContainer: {
    flex: 1,
    flexDirection: "column",
    paddingHorizontal: 20,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  deviceNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  deviceName: {
    marginRight: 10,
    fontSize: 16,
  },
  deviceFirmware: {
    fontSize: 13,
    paddingRight: 8,
  },
  deviceCapacity: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  storageSection: {
    flex: 1,
    paddingVertical: 20,
  },
  separator: {
    width: "100%",
    height: 1,
  },
  firmwareBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 4,
    padding: 12,
    marginTop: 16,
  },
  firmwareBannerText: {
    flex: 1,
    fontWeight: "600",
  },
  firmwareBannerCTA: {
    paddingLeft: 48,
  },
});

export default memo(DeviceCard);
