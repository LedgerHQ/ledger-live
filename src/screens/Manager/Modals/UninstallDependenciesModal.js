import React, { memo, useCallback } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Trans } from "react-i18next";

import type { Action, State } from "@ledgerhq/live-common/lib/apps";
import type { App } from "@ledgerhq/live-common/lib/types/manager";

import AppIcon from "../AppsList/AppIcon";
import colors from "../../../colors";
import CollapsibleList from "../../../components/CollapsibleList";
import LText from "../../../components/LText";
import AppTree from "../../../icons/AppTree";
import ListTreeLine from "../../../icons/ListTreeLine";

import ActionModal from "./ActionModal";

const renderDepLine = ({ item }: *) => (
  <View style={styles.depLine}>
    <View style={styles.depLineTree}>
      <ListTreeLine color={colors.grey} />
    </View>
    <AppIcon icon={item.icon} />
    <LText semiBold style={styles.depLineText}>
      {item.name}
    </LText>
  </View>
);

type Props = {
  app: App,
  state: State,
  dispatch: Action => void,
  onClose: Function,
};

const UninstallDependenciesModal = ({
  app,
  state,
  dispatch,
  onClose,
}: Props) => {
  const unInstallApp = useCallback(() => {
    dispatch({ type: "uninstall", name });
    onClose();
  }, [dispatch, onClose]);

  if (!app) return null;

  const { name } = app;
  const { installed, apps } = state;

  const dependentApps = apps
    .filter(a => installed.some(i => i.name === a.name))
    .filter(({ dependencies }) => dependencies.includes(name));

  const modalActions = [
    {
      title: "Continue uninstall",
      onPress: unInstallApp,
      type: "alert",
    },
    {
      title: "Close",
      onPress: onClose,
      type: "secondary",
      outline: false,
    },
  ];

  return (
    <ActionModal isOpened={!!app} onClose={onClose} actions={modalActions}>
      <ScrollView>
        <View style={styles.imageSection}>
          <AppTree color={colors.fog} icon={app.icon} />
        </View>
        <View style={styles.infoRow}>
          <LText style={[styles.warnText, styles.title]} bold>
            <Trans
              i18nKey="AppAction.uninstall.dependency.title"
              values={{ app: name }}
            />
          </LText>
          <LText style={styles.warnText}>
            <Trans
              i18nKey="AppAction.uninstall.dependency.description"
              values={{ app: name }}
            />
          </LText>
        </View>
        <View style={styles.collapsibleList}>
          <CollapsibleList
            title={<Trans i18nKey="AppAction.uninstall.dependency.showAll" />}
            data={dependentApps}
            renderItem={renderDepLine}
          />
        </View>
      </ScrollView>
    </ActionModal>
  );
};

const styles = StyleSheet.create({
  imageSection: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "nowrap",
    marginBottom: 24,
  },
  appIcons: {
    flexBasis: 50,
  },
  separator: {
    flexBasis: 23,
    height: 1,
    borderColor: colors.lightLive,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 1,
    marginHorizontal: 6,
  },
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
  collapsibleList: {
    padding: 16,
  },
  depLine: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    paddingLeft: 23,
  },
  depLineTree: {
    position: "absolute",
    bottom: 20,
    left: 0,
  },
  depLineText: {
    fontSize: 12,
    color: colors.darkBlue,
    paddingLeft: 12,
    flex: 1,
    textAlign: "left",
  },
});

export default memo(UninstallDependenciesModal);
