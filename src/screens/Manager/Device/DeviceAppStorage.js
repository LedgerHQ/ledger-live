import React, { memo, useMemo } from "react";

import { View, StyleSheet } from "react-native";
import * as Animatable from "react-native-animatable";
import { Trans } from "react-i18next";

import type { AppsDistribution } from "@ledgerhq/live-common/lib/apps";
import { formatSize } from "@ledgerhq/live-common/lib/apps";
import LText from "../../../components/LText";
import colors from "../../../colors";

import Warning from "../../../icons/Warning";

type Props = {
  distribution: AppsDistribution,
};

const DeviceAppStorage = ({
  distribution: {
    freeSpaceBytes,
    appsSpaceBytes,
    shouldWarnMemory,
    totalAppsBytes,
    apps,
  },
}: Props) => {
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
    color: shouldWarnMemory ? colors.orange : colors.darkBlue,
  };

  return (
    <View style={styles.root}>
      <View style={[styles.row, styles.storageLeftRow]}>
        <LText bold style={styles.storageText}>
          <Trans i18nKey="manager.storage.title" />
        </LText>
        <View style={styles.warnRow}>
          {shouldWarnMemory && <Warning color={colors.orange} size={15} />}
          <LText bold style={[styles.storageText, storageWarnStyle]}>
            {" "}
            {formatSize(freeSpaceBytes)}
          </LText>
          <LText style={[styles.storageText, storageWarnStyle]}>
            {" "}
            <Trans i18nKey="manager.storage.storageAvailable" />
          </LText>
        </View>
      </View>
      <View style={[styles.row, styles.graphRow]}>
        {appSizes.map(({ ratio, color, name }, i) => (
          <Animatable.View
            animation="slideInLeft"
            duration={400}
            useNativeDriver
            key={`${i}${name}`}
            style={[
              styles.graphBlock,
              {
                width: `${ratio}%`,
                backgroundColor: color,
              },
            ]}
          />
        ))}
      </View>
      <View style={[styles.row, styles.infoRow]}>
        <LText style={styles.storageText} bold>
          {formatSize(totalAppsBytes) || "0kb"}
        </LText>
        <LText style={styles.storageText}>
          {" "}
          <Trans i18nKey="manager.storage.used" />,{" "}
        </LText>
        <LText style={styles.storageText} bold>
          {apps.length}
        </LText>
        <LText style={styles.storageText}>
          <Trans values={{}} i18nKey="manager.storage.appsInstalled" />
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
  infoSubTitle: {
    fontSize: 13,
    color: colors.grey,
  },
  graphRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    flexBasis: 23,
    height: 23,
    marginVertical: 16,
    backgroundColor: colors.lightFog,
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
    minWidth: "1%",
    height: "100%",
    borderRightColor: colors.white,
    borderRightWidth: 2,
  },
});

export default memo(DeviceAppStorage);
