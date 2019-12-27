import React, { memo, useMemo, useCallback, useContext } from "react";

import { View, StyleSheet, TouchableOpacity } from "react-native";

import * as Animatable from "react-native-animatable";

import type { ApplicationVersion } from "@ledgerhq/live-common/lib/types/manager";
import {
  formatSize,
  isOutOfMemoryState,
  predictOptimisticState,
  reducer,
  State,
  Action,
} from "@ledgerhq/live-common/lib/apps";
import colors from "../../../colors";
import LText from "../../../components/LText";
import Exclamation from "../../../icons/Exclamation";
import AppIcon from "./AppIcon";

import AppStateButton from "./AppStateButton";

import { ManagerContext } from "../Manager";

type Props = {
  app: ApplicationVersion,
  state: State,
  dispatch: Action => void,
  listView: String,
  index: Number,
};

const AppRow = ({ app, state, dispatch, listView, index }: Props) => {
  const { name, version, bytes, icon } = app;
  const { installed } = state;
  const { setStorageWarning, MANAGER_TABS } = useContext(ManagerContext);

  const notEnoughMemoryToInstall = useMemo(
    () =>
      isOutOfMemoryState(
        predictOptimisticState(reducer(state, { type: "install", name })),
      ),
    [name, state],
  );

  const onSizePress = useCallback(() => setStorageWarning(name), [
    setStorageWarning,
    name,
  ]);

  const isInstalled = useMemo(() => installed.some(i => i.name === name), [
    installed,
    name,
  ]);

  return (
    <Animatable.View
      style={styles.root}
      animation={index <= 11 ? "fadeInUp" : "fadeIn"}
      duration={400}
      delay={index <= 11 ? index * 40 : 0}
      useNativeDriver
    >
      <AppIcon icon={icon} />
      <View style={styles.labelContainer}>
        <LText numberOfLines={1} bold>
          {name}
        </LText>
        <LText numberOfLines={1} style={styles.versionText}>
          {version}
        </LText>
      </View>
      {!isInstalled && notEnoughMemoryToInstall ? (
        <TouchableOpacity
          activeOpacity={0.5}
          onPress={onSizePress}
          style={styles.warnText}
        >
          <View style={styles.warnIcon}>
            <Exclamation size={16} color={colors.white} />
          </View>
          <LText
            semiBold
            style={[styles.versionText, styles.sizeText, styles.warnText]}
          >
            {formatSize(bytes || 0)}
          </LText>
        </TouchableOpacity>
      ) : (
        <LText
          style={[
            styles.versionText,
            styles.sizeText,
            notEnoughMemoryToInstall ? styles.warnText : {},
          ]}
        >
          {formatSize(bytes || 0)}
        </LText>
      )}
      <AppStateButton
        app={app}
        state={state}
        dispatch={dispatch}
        notEnoughMemoryToInstall={notEnoughMemoryToInstall}
        isInstalled={isInstalled}
        isInstalledView={listView === MANAGER_TABS.INSTALLED_APPS}
      />
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 0,
    height: 64,
    zIndex: 10,
    borderBottomColor: colors.lightFog,
    borderBottomWidth: 1,
  },
  labelContainer: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: "40%",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.grey,
  },
  sizeText: {
    fontSize: 12,
    width: 44,
    marginHorizontal: 10,
  },
  warnText: {
    color: colors.orange,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  warnIcon: {
    height: 16,
    width: 16,
    backgroundColor: colors.orange,
    borderRadius: 16,
  },
  installedLabel: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    borderRadius: 4,
    overflow: "hidden",
    paddingHorizontal: 10,
  },
  installedText: {
    paddingLeft: 10,
    color: colors.green,
  },
  appButton: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: "auto",
    alignItems: "flex-start",
    height: 38,
    paddingHorizontal: 10,
    paddingVertical: 12,
    zIndex: 5,
  },
});

export default memo(AppRow);
