import React, { memo, useMemo, useCallback, useContext } from "react";

import { View, StyleSheet, TouchableOpacity } from "react-native";

import * as Animatable from "react-native-animatable";

import { isEqual } from "lodash";

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
import Warning from "../../../icons/Warning";
import AppIcon from "./AppIcon";

import AppStateButton from "./AppStateButton";

import { ManagerContext } from "../shared";

type Props = {
  app: ApplicationVersion,
  state: State,
  dispatch: Action => void,
  tab: string,
  visible: boolean,
};

const AppRow = ({ app, state, dispatch, tab, visible }: Props) => {
  const { name, version, bytes, icon } = app;
  const { installed } = state;
  const { setStorageWarning, MANAGER_TABS } = useContext(ManagerContext);

  const isInstalled = useMemo(() => installed.some(i => i.name === name), [
    installed,
    name,
  ]);

  const notEnoughMemoryToInstall = useMemo(
    () =>
      visible &&
      !isInstalled &&
      isOutOfMemoryState(
        predictOptimisticState(reducer(state, { type: "install", name })),
      ),
    [isInstalled, name, state, visible],
  );

  const onSizePress = useCallback(() => setStorageWarning(name), [
    setStorageWarning,
    name,
  ]);

  return (
    <View style={styles.root}>
      {visible && (
        <Animatable.View
          style={styles.item}
          animation="fadeIn"
          duration={300}
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
              <Warning size={16} color={colors.lightOrange} />
              <LText
                semiBold
                style={[styles.versionText, styles.sizeText, styles.warnText]}
              >
                {formatSize(bytes)}
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
              {formatSize(bytes)}
            </LText>
          )}
          <AppStateButton
            app={app}
            state={state}
            dispatch={dispatch}
            notEnoughMemoryToInstall={notEnoughMemoryToInstall}
            isInstalled={isInstalled}
            isInstalledView={tab === MANAGER_TABS.INSTALLED_APPS}
          />
        </Animatable.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    height: 64,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 0,
    height: 64,
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
    color: colors.lightOrange,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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

export default memo(
  AppRow,
  (prevProps, nextProps) =>
    !nextProps.visible && isEqual(prevProps.state, nextProps.state),
);
