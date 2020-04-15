import React, { useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";

import { Trans } from "react-i18next";

import { useAppInstallNeedsDeps } from "@ledgerhq/live-common/lib/apps/react";

import type { App } from "@ledgerhq/live-common/lib/types/manager";
import type { Action, State } from "@ledgerhq/live-common/lib/apps";

import Button from "../../../components/Button";

type Props = {
  app: App,
  state: State,
  dispatch: Action => void,
  notEnoughMemoryToInstall: boolean,
  setAppInstallWithDependencies: ({ app: App, dependencies: App[] }) => void,
};

const AppInstallButton = ({
  app,
  state,
  dispatch,
  notEnoughMemoryToInstall,
  setAppInstallWithDependencies,
}: Props) => {
  const { name } = app;
  const { installed, updateAllQueue } = state;

  const canUpdate = useMemo(
    () => installed.some(({ name, updated }) => name === app.name && !updated),
    [installed, app.name],
  );

  const needsDependencies = useAppInstallNeedsDeps(state, app);

  const installApp = useCallback(() => {
    if (needsDependencies && setAppInstallWithDependencies)
      setAppInstallWithDependencies(needsDependencies);
    else dispatch({ type: "install", name });
  }, [dispatch, name, needsDependencies, setAppInstallWithDependencies]);

  return (
    <Button
      disabled={notEnoughMemoryToInstall || updateAllQueue.length > 0}
      useTouchable
      type={canUpdate ? "tertiary" : "lightPrimary"}
      outline={!canUpdate}
      title={<Trans i18nKey={canUpdate ? "common.update" : "common.install"} />}
      containerStyle={styles.appButton}
      titleStyle={styles.appStateText}
      onPress={installApp}
      event="ManagerAppInstall"
      eventProperties={{ appName: name }}
    />
  );
};

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
  },
});

export default AppInstallButton;
