import React, { memo } from "react";
import { StyleSheet, View, FlatList } from "react-native";
import type { App } from "@ledgerhq/live-common/lib/types/manager";
import { formatSize } from "@ledgerhq/live-common/lib/apps";

import { Trans } from "react-i18next";
import colors from "../../../colors";
import LText from "../../../components/LText";
import AppIcon from "../AppsList/AppIcon";
import ActionModal from "./ActionModal";

const renderAppLine = ({ item }: { item: App }) => (
  <View style={styles.appLine}>
    <AppIcon icon={item.icon} />
    <LText semiBold style={styles.appName}>
      {item.name}
    </LText>
    <LText style={styles.appLineText}>{item.version}</LText>
    <LText style={styles.appLineText}>{formatSize(item.bytes) || "0kb"}</LText>
  </View>
);

const keyExtractor = (item: App, index: number) => String(item.id) + index;

type Props = {
  isOpened: Boolean,
  apps: Array<App>,
  onClose: Function,
  onConfirm: Function,
};

const UpdateAllModal = ({ isOpened, apps, onClose, onConfirm }: Props) => {
  const modalActions = [
    {
      title: <Trans i18nKey="AppAction.update.buttonModal" />,
      onPress: onConfirm,
      type: "primary",
    },
    {
      title: <Trans i18nKey="common.cancel" />,
      onPress: onClose,
      type: "secondary",
      outline: false,
    },
  ];

  return (
    <ActionModal isOpened={isOpened} onClose={onClose} actions={modalActions}>
      <View style={styles.infoRow}>
        <LText style={[styles.warnText, styles.title]} bold>
          <Trans i18nKey="AppAction.update.titleModal" />
        </LText>
      </View>
      <FlatList
        style={styles.list}
        data={apps}
        renderItem={renderAppLine}
        keyExtractor={keyExtractor}
      />
    </ActionModal>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    color: colors.darkBlue,
  },
  warnText: {
    textAlign: "center",
    fontSize: 13,
    color: colors.grey,
    lineHeight: 16,
    marginVertical: 8,
  },
  infoRow: {
    paddingHorizontal: 16,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    width: "100%",
    paddingHorizontal: 16,
  },
  appLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    flexWrap: "nowrap",
    height: 66,
    borderTopColor: colors.lightFog,
    borderTopWidth: 1,
  },
  appName: {
    flexGrow: 1,
    flexBasis: "40%",
    marginHorizontal: 12,
    fontSize: 14,
    color: colors.darkBlue,
  },
  appLineText: {
    flexBasis: 55,
    fontSize: 12,
    color: colors.grey,
  },
});

export default memo(UpdateAllModal);
