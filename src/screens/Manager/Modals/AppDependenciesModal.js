import React, { memo } from "react";
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
  onClose: Function,
};

const AppDependenciesModal = ({ app, appList, dispatch, onClose }: Props) => {
  if (!app) return null;

  const installAppDependencies = () => {
    dispatch({ type: "install", name });
    onClose();
  };

  const { name, dependencies } = app;
  const dependentApps = appList.filter(a => dependencies.includes(a.name));

  const modalActions = [
    {
      title: "Continue install",
      onPress: installAppDependencies,
      type: "primary",
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
        <LText style={styles.warnText}>
          <Trans
            i18nKey="AppAction.install.dependency.description"
            values={{ dependency: dependencies.join(" "), app: name }}
          />
        </LText>
      </View>
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
});

export default memo(AppDependenciesModal);
