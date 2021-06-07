import React, { useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Trans } from "react-i18next";
import manager from "@ledgerhq/live-common/lib/manager";

import type { App } from "@ledgerhq/live-common/lib/types/manager";
import type { Action, State } from "@ledgerhq/live-common/lib/apps";
import { useAppInstallNeedsDeps } from "@ledgerhq/live-common/lib/apps/react";
import { useTheme } from "@react-navigation/native";
import { hasInstalledAnyAppSelector } from "../../../reducers/settings";
import { installAppFirstTime } from "../../../actions/settings";

import LText from "../../../components/LText";
import Touchable from "../../../components/Touchable";

type Props = {
  app: App,
  state: State,
  dispatch: (action: Action) => void,
  notEnoughMemoryToInstall: boolean,
  setAppInstallWithDependencies: ({ app: App, dependencies: App[] }) => void,
};

export default function AppInstallButton({
  app,
  state,
  dispatch: dispatchProps,
  notEnoughMemoryToInstall,
  setAppInstallWithDependencies,
}: Props) {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const hasInstalledAnyApp = useSelector(hasInstalledAnyAppSelector);
  const canInstall = useMemo(() => manager.canHandleInstall(app), [app]);

  const { name } = app;
  const { installed, updateAllQueue } = state;

  const canUpdate = useMemo(
    () => installed.some(({ name, updated }) => name === app.name && !updated),
    [installed, app.name],
  );

  const needsDependencies = useAppInstallNeedsDeps(state, app);

  const disabled = useMemo(
    () => !canInstall || notEnoughMemoryToInstall || updateAllQueue.length > 0,
    [canInstall, notEnoughMemoryToInstall, updateAllQueue.length],
  );

  const installApp = useCallback(() => {
    if (disabled) return;
    if (needsDependencies && setAppInstallWithDependencies) {
      setAppInstallWithDependencies(needsDependencies);
    } else {
      dispatchProps({ type: "install", name });
    }
    if (!hasInstalledAnyApp) {
      dispatch(installAppFirstTime(true));
    }
  }, [
    disabled,
    dispatch,
    dispatchProps,
    name,
    needsDependencies,
    setAppInstallWithDependencies,
    hasInstalledAnyApp,
  ]);

  return (
    <Touchable
      style={[
        styles.appButton,
        { backgroundColor: disabled ? colors.lightFog : colors.lightLive },
      ]}
      onPress={installApp}
      event="ManagerAppInstall"
      eventProperties={{ appName: name }}
    >
      <LText
        semiBold
        style={styles.appStateText}
        color={disabled ? "grey" : "live"}
      >
        <Trans i18nKey={canUpdate ? "common.update" : "common.install"} />
      </LText>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  appStateText: {
    fontSize: 12,
  },
  appButton: {
    flexGrow: 1,
    flexBasis: "auto",
    height: 38,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "red",
  },
});
