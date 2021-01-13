import React, { memo, useMemo } from "react";

import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";

import type { DeviceModel } from "@ledgerhq/devices";
import type { AppsDistribution } from "@ledgerhq/live-common/lib/apps";
import { useTheme } from "@react-navigation/native";
import LText from "../../../components/LText";

import Warning from "../../../icons/Warning";
import Touchable from "../../../components/Touchable";
import ByteSize from "../../../components/ByteSize";

type Props = {
  deviceModel: DeviceModel,
  distribution: AppsDistribution,
};

const DeviceAppStorage = ({
  deviceModel,
  distribution: {
    freeSpaceBytes,
    appsSpaceBytes,
    shouldWarnMemory,
    totalAppsBytes,
    apps,
  },
}: Props) => {
  const { colors } = useTheme();
  const appSizes = useMemo(
    () =>
      apps.filter(Boolean).map(({ bytes, currency, name }) => ({
        name,
        ratio: Number((bytes / appsSpaceBytes) * 100).toFixed(2),
        color: (currency && currency.color) || "#000000",
      })),
    [apps, appsSpaceBytes],
  );

  const storageWarnStyle = {
    color: shouldWarnMemory ? colors.lightOrange : colors.darkBlue,
  };

  return (
    <View style={styles.root}>
      <View style={[styles.row, styles.storageLeftRow]}>
        <LText bold style={styles.storageText}>
          <Trans i18nKey="manager.storage.title" />
        </LText>
        <View style={styles.warnRow}>
          {shouldWarnMemory && <Warning color={colors.lightOrange} size={15} />}
          <LText bold style={[styles.storageText, storageWarnStyle]}>
            {" "}
            <ByteSize value={freeSpaceBytes} deviceModel={deviceModel} />
          </LText>
          <LText style={[styles.storageText, storageWarnStyle]}>
            {" "}
            <Trans i18nKey="manager.storage.storageAvailable" />
          </LText>
        </View>
      </View>
      <Touchable
        activeOpacity={1}
        style={[
          styles.row,
          styles.graphRow,
          { backgroundColor: colors.lightFog },
        ]}
        onPress={() => {}}
        event="ManagerAppDeviceGraphClick"
      >
        {appSizes.map(({ ratio, color, name }, i) => (
          <View
            key={`${i}${name}`}
            style={[
              styles.graphBlock,
              {
                flexBasis: `${ratio}%`,
                backgroundColor: color,
                borderRightColor: colors.white,
              },
            ]}
          />
        ))}
      </Touchable>
      <View style={[styles.row, styles.infoRow]}>
        {totalAppsBytes > 0 && (
          <>
            <LText style={styles.storageText} bold>
              <ByteSize value={totalAppsBytes} deviceModel={deviceModel} />
            </LText>
            <LText style={styles.storageText}>
              {" "}
              <Trans i18nKey="manager.storage.used" />,{" "}
            </LText>
          </>
        )}
        <LText style={styles.storageText}>
          <Trans
            count={apps.length}
            values={{ number: apps.length }}
            i18nKey="manager.storage.appsInstalled"
          >
            <LText style={styles.storageText} bold>
              {"placeholder"}
            </LText>
            {"placeholder"}
          </Trans>
        </LText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "column",
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  warnRow: { flexDirection: "row" },
  infoRow: {
    flexBasis: 16,
    justifyContent: "flex-start",
  },
  infoBlock: {
    flex: 1,
    alignItems: "center",
  },
  infoTitle: {
    fontSize: 13,
  },
  graphRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    flexBasis: 23,
    height: 23,
    marginVertical: 16,

    borderRadius: 3,
    overflow: "hidden",
  },
  storageLeftRow: {
    justifyContent: "space-between",
    flexBasis: 16,
  },
  storageText: {
    fontSize: 12,
  },
  graphBlock: {
    flexBasis: 0,
    flexGrow: 0.005,
    flexShrink: 1,
    height: "100%",

    borderRightWidth: StyleSheet.hairlineWidth,
  },
});

export default memo(DeviceAppStorage);
