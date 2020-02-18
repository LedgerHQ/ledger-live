import React, { memo, useMemo } from "react";
import { StyleSheet, View, FlatList } from "react-native";
import type { App } from "@ledgerhq/live-common/lib/types/manager";
import type { InstalledItem } from "@ledgerhq/live-common/lib/apps";
import { formatSize } from "@ledgerhq/live-common/lib/apps";

import { Trans } from "react-i18next";
import colors from "../../../colors";
import LText from "../../../components/LText";
import AppIcon from "../AppsList/AppIcon";
import ActionModal from "./ActionModal";

const renderAppLine = ({
  item: { name, icon, bytes, version: appVersion, installed },
}: {
  item: App & { installed: ?InstalledItem },
}) => {
  const version = (installed && installed.version) || appVersion;
  const availableVersion =
    (installed && installed.availableVersion) || appVersion;

  return (
    <View style={styles.appLine}>
      <AppIcon icon={icon} />
      <LText semiBold style={styles.appName}>
        {name}
      </LText>
      <LText style={[styles.appLineText, styles.appLineVersion]}>
        {version}{" "}
        <Trans
          i18nKey="manager.appList.versionNew"
          values={{
            newVersion:
              availableVersion !== version ? ` ${availableVersion}` : "",
          }}
        />
      </LText>
      <LText style={styles.appLineText}>{formatSize(bytes)}</LText>
    </View>
  );
};

const keyExtractor = (item: App, index: number) => String(item.id) + index;

type Props = {
  isOpened: boolean,
  apps: App[],
  installed: InstalledItem[],
  onClose: () => void,
  onConfirm: () => void,
};

const UpdateAllModal = ({
  isOpened,
  apps,
  installed,
  onClose,
  onConfirm,
}: Props) => {
  const modalActions = useMemo(
    () => [
      {
        title: <Trans i18nKey="AppAction.update.buttonModal" />,
        onPress: onConfirm,
        type: "primary",
        event: "ManagerAppUpdateAllModalConfirm",
        eventProperties: { appsList: apps.map(({ name }) => name) },
      },
      {
        title: <Trans i18nKey="common.cancel" />,
        onPress: onClose,
        type: "secondary",
        outline: false,
        event: "ManagerAppUpdateAllModalCancel",
      },
    ],
    [onConfirm, onClose, apps],
  );

  const data = apps.map(app => ({
    ...app,
    installed: installed.find(({ name }) => name === app.name),
  }));

  return (
    <ActionModal isOpened={isOpened} onClose={onClose} actions={modalActions}>
      <View style={styles.infoRow}>
        <LText style={[styles.warnText, styles.title]} bold>
          <Trans i18nKey="AppAction.update.titleModal" />
        </LText>
      </View>
      <FlatList
        style={styles.list}
        data={data}
        renderItem={renderAppLine}
        keyExtractor={keyExtractor}
        bounces={false}
      />
    </ActionModal>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    color: colors.darkBlue,
    marginBottom: 32,
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
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.lightFog,
  },
  appLine: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    flexWrap: "nowrap",
    height: 66,
    borderBottomColor: colors.lightFog,
    borderBottomWidth: 1,
  },
  appName: {
    flexGrow: 0,
    flexBasis: "30%",
    marginHorizontal: 12,
    fontSize: 14,
    color: colors.darkBlue,
  },
  appLineText: {
    flexBasis: 55,
    fontSize: 12,
    color: colors.grey,
  },
  appLineVersion: {
    flexGrow: 1,
  },
});

export default memo(UpdateAllModal);
