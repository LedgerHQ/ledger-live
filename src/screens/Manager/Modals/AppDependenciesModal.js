import React, { memo, useMemo, useCallback } from "react";
import { compose } from "redux";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import { connect } from "react-redux";

import type { Action } from "@ledgerhq/live-common/lib/apps";
import type { App } from "@ledgerhq/live-common/lib/types/manager";

import { hasInstalledAnyAppSelector } from "../../../reducers/settings";
import { installAppFirstTime } from "../../../actions/settings";
import AppIcon from "../AppsList/AppIcon";
import colors from "../../../colors";
import LText from "../../../components/LText";
import InfoIcon from "../../../components/InfoIcon";
import LinkIcon from "../../../icons/LinkIcon";

import ActionModal from "./ActionModal";

const mapStateToProps = state => {
  return {
    hasInstalledAnyApp: hasInstalledAnyAppSelector(state),
  };
};

type Props = {
  appInstallWithDependencies: ?{ app: App, dependencies: App[] },
  dispatch: Action => void,
  onClose: () => void,
  hasInstalledAnyApp: boolean,
  installAppFirstTime: boolean => void,
};

const AppDependenciesModal = ({
  appInstallWithDependencies,
  dispatch,
  onClose,
  hasInstalledAnyApp,
  installAppFirstTime,
}: Props) => {
  const { app, dependencies = [] } = appInstallWithDependencies || {};
  const { name } = app || {};

  const installAppDependencies = useCallback(() => {
    if (!hasInstalledAnyApp) {
      installAppFirstTime(true);
    }
    dispatch({ type: "install", name });
    onClose();
  }, [dispatch, onClose, name, hasInstalledAnyApp, installAppFirstTime]);

  const modalActions = useMemo(
    () => [
      {
        title: <Trans i18nKey="AppAction.install.continueInstall" />,
        onPress: installAppDependencies,
        type: "primary",
        event: "ManagerAppDepsInstallConfirm",
        eventProperties: { appName: name },
      },
      {
        title: <Trans i18nKey="common.close" />,
        onPress: onClose,
        type: "secondary",
        outline: false,
        event: "ManagerAppDepsInstallCancel",
        eventProperties: { appName: name },
      },
    ],
    [installAppDependencies, onClose, name],
  );

  return (
    <ActionModal isOpened={!!app} onClose={onClose} actions={modalActions}>
      {!!app && !!dependencies.length && (
        <>
          <View style={styles.imageSection}>
            <AppIcon style={styles.appIcons} icon={app.icon} />
            <View style={styles.separator} />
            <InfoIcon bg={colors.lightLive} size={30}>
              <LinkIcon color={colors.live} />
            </InfoIcon>
            <View style={styles.separator} />
            <AppIcon style={styles.appIcons} icon={dependencies[0].icon} />
          </View>
          <View style={styles.infoRow}>
            <LText style={[styles.warnText, styles.title]} bold>
              <Trans
                i18nKey="AppAction.install.dependency.title"
                values={{ dependency: dependencies[0].name }}
              />
            </LText>
            <LText style={[styles.warnText, styles.marginTop]}>
              <Trans
                i18nKey="AppAction.install.dependency.description_one"
                values={{ dependency: dependencies[0].name, app: name }}
              />
            </LText>
            <LText style={[styles.warnText, styles.marginTop]}>
              <Trans
                i18nKey="AppAction.install.dependency.description_two"
                values={{ dependency: dependencies[0].name, app: name }}
              />
            </LText>
          </View>
        </>
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
    marginVertical: 24,
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
  },
  marginTop: {
    marginTop: 16,
  },
  infoRow: {
    paddingHorizontal: 16,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default compose(
  connect(
    mapStateToProps,
    { installAppFirstTime },
  ),
  memo,
)(AppDependenciesModal);
