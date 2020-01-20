import React, { memo, useMemo, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";

import type { Action } from "@ledgerhq/live-common/lib/apps";
import type { App } from "@ledgerhq/live-common/lib/types/manager";

import AppIcon from "../AppsList/AppIcon";
import colors from "../../../colors";
import LText from "../../../components/LText";
import InfoIcon from "../../../components/InfoIcon";
import LinkIcon from "../../../icons/LinkIcon";

import ActionModal from "./ActionModal";

type Props = {
  app: App,
  appList: Array<App>,
  dispatch: Action => void,
  onClose: () => void,
};

const AppDependenciesModal = ({ app, appList, dispatch, onClose }: Props) => {
  const name = useMemo(() => app && app.name, [app]);
  const dependencies = useMemo(() => app && app.dependencies, [app]);

  const installAppDependencies = useCallback(() => {
    dispatch({ type: "install", name });
    onClose();
  }, [dispatch, onClose, name]);

  const dependentApps = useMemo(
    () => dependencies && appList.filter(a => dependencies.includes(a.name)),
    [appList, dependencies],
  );

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
      {!!app && (
        <>
          <View style={styles.imageSection}>
            <AppIcon style={styles.appIcons} icon={app.icon} />
            <View style={styles.separator} />
            <InfoIcon bg={colors.lightLive} size={30}>
              <LinkIcon color={colors.live} />
            </InfoIcon>
            <View style={styles.separator} />
            {dependentApps.map(({ icon }, i) => (
              <AppIcon style={styles.appIcons} icon={icon} key={i} />
            ))}
          </View>
          <View style={styles.infoRow}>
            <LText style={[styles.warnText, styles.title]} bold>
              <Trans
                i18nKey="AppAction.install.dependency.title"
                values={{ dependency: dependencies.join(" ") }}
              />
            </LText>
            <LText style={[styles.warnText, styles.marginTop]}>
              <Trans
                i18nKey="AppAction.install.dependency.description_one"
                values={{ dependency: dependencies.join(" "), app: name }}
              />
            </LText>
            <LText style={[styles.warnText, styles.marginTop]}>
              <Trans
                i18nKey="AppAction.install.dependency.description_two"
                values={{ dependency: dependencies.join(" "), app: name }}
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

export default memo(AppDependenciesModal);
