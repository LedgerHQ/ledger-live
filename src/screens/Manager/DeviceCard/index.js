import React, { memo } from "react";

import { StyleSheet, View, Image } from "react-native";
import { Trans } from "react-i18next";
import type { State } from "@ledgerhq/live-common/lib/apps";
import { formatSize, distribute } from "@ledgerhq/live-common/lib/apps";
import LText from "../../../components/LText";
import Genuine from "../../../icons/Genuine";
import DeviceAppStorage from "./DeviceAppStorage";

import nanoS from "./images/nanoS.png";
import nanoX from "./images/nanoX.png";
import blue from "./images/blue.png";

import Card from "../../../components/Card";

import colors from "../../../colors";

const illustrations = {
  nanoS,
  nanoX,
  blue,
};

type Props = {
  state: State,
};

const DeviceCard = ({ state }: Props) => {
  const { deviceModel, firmware } = state;
  const distribution = distribute(state);
  const capacity = formatSize(distribution.appsSpaceBytes) || "0kb";

  return (
    <View style={styles.root}>
      <Card style={styles.card}>
        <View style={styles.deviceSection}>
          <View style={styles.deviceImageContainer}>
            <Image
              style={styles.deviceImage}
              source={illustrations[deviceModel.id]}
              resizeMode="contain"
            />
          </View>
          <View style={styles.deviceInfoContainer}>
            <View style={styles.deviceNameContainer}>
              <LText bold style={styles.deviceName}>
                {deviceModel.productName}
              </LText>
              <Genuine />
            </View>

            <LText style={styles.deviceFirmware}>
              <Trans
                i18nKey="FirmwareVersionRow.subtitle"
                values={{ version: firmware.version }}
              />
            </LText>
            <View style={styles.deviceCapacity}>
              <LText style={styles.deviceFirmware}>
                <Trans i18nKey="manager.storage.capacity" />
              </LText>
              <LText style={{ fontSize: 13 }} semiBold>
                {" "}
                {capacity}
              </LText>
            </View>
          </View>
        </View>
        <View style={styles.separator} />
        <View style={styles.storageSection}>
          <DeviceAppStorage distribution={distribution} />
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {},
  card: {
    height: 265,
    flexDirection: "column",
    paddingHorizontal: 16,
  },
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
    color: colors.grey,
  },
  deviceCapacity: {
    flexDirection: "row",
    marginTop: 16,
  },
  storageSection: {
    flex: 1,
    paddingVertical: 20,
  },
  separator: {
    width: "100%",
    height: 1,
    backgroundColor: colors.lightFog,
  },
});

export default memo(DeviceCard);
