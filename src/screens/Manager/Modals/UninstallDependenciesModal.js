import React, { memo, useMemo, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";

import type { Action } from "@ledgerhq/live-common/lib/apps";
import type { App } from "@ledgerhq/live-common/lib/types/manager";

import AppIcon from "../AppsList/AppIcon";
import colors from "../../../colors";
import CollapsibleList from "../../../components/CollapsibleList";
import LText from "../../../components/LText";
import AppTree from "../../../icons/AppTree";
import ListTreeLine from "../../../icons/ListTreeLine";

import getWindowDimensions from "../../../logic/getWindowDimensions";

import ActionModal from "./ActionModal";

const { height } = getWindowDimensions();

const LIST_HEIGHT = height - 420;
const LINE_HEIGHT = 46;

const renderDepLine = ({ item }: *) => (
  <View style={styles.depLine}>
    <View style={styles.depLineTree}>
      <ListTreeLine color={colors.grey} />
    </View>
    <AppIcon icon={item.icon} size={22} />
    <LText semiBold style={styles.depLineText}>
      {item.name}
    </LText>
  </View>
);

type Props = {
  appUninstallWithDependencies: ?{ app: App, dependents: App[] },
  dispatch: Action => void,
  onClose: () => void,
};

const UninstallDependenciesModal = ({
  appUninstallWithDependencies,
  dispatch,
  onClose,
}: Props) => {
  const { app, dependents = [] } = appUninstallWithDependencies || {};
  const { name } = app || {};

  const unInstallApp = useCallback(() => {
    dispatch({ type: "uninstall", name });
    onClose();
  }, [dispatch, onClose, name]);

  const modalActions = useMemo(
    () => [
      {
        title: (
          <Trans
            i18nKey="AppAction.uninstall.continueUninstall"
            values={{ app: name }}
          />
        ),
        onPress: unInstallApp,
        type: "alert",
        event: "ManagerAppDepsUninstallConfirm",
        eventProperties: { appName: name },
      },
      {
        title: <Trans i18nKey="common.close" />,
        onPress: onClose,
        type: "secondary",
        outline: false,
        event: "ManagerAppDepsUninstallCancel",
        eventProperties: { appName: name },
      },
    ],
    [unInstallApp, onClose, name],
  );

  return (
    <ActionModal isOpened={!!app} onClose={onClose} actions={modalActions}>
      {app && dependents.length && (
        <View>
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
            <LText style={styles.warnText}>
              <Trans i18nKey="manager.uninstall.description" />
            </LText>
          </View>
          <View style={styles.collapsibleList}>
            <CollapsibleList
              title={<Trans i18nKey="AppAction.uninstall.dependency.showAll" />}
              data={[app, ...dependents]}
              renderItem={renderDepLine}
              itemHeight={LINE_HEIGHT}
              containerStyle={{
                maxHeight:
                  LIST_HEIGHT - (LIST_HEIGHT % LINE_HEIGHT) - LINE_HEIGHT / 2, // max height available but still cutting the list mid items for UX
              }}
            />
          </View>
        </View>
      )}
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
    marginVertical: 8,
    height: 90,
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
    marginVertical: 6,
  },
  infoRow: {
    padding: 16,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  collapsibleList: {
    paddingHorizontal: 16,
  },
  depLine: {
    height: LINE_HEIGHT,
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
