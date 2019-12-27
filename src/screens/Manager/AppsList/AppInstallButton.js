import React, { memo, useCallback, useContext } from "react";
import { StyleSheet } from "react-native";

import { Trans } from "react-i18next";

import type { App } from "@ledgerhq/live-common/lib/types/manager";
import type { Action, State } from "@ledgerhq/live-common/lib/apps";

import { ManagerContext } from "../ManagerContext";
import Button from "../../../components/Button";

type Props = {
  app: App,
  state: State,
  dispatch: Action => void,
  notEnoughMemoryToInstall: Boolean,
};

const AppInstallButton = ({
  app,
  state,
  dispatch,
  notEnoughMemoryToInstall,
}: Props) => {
  const { setAppInstallWithDependencies } = useContext(ManagerContext);
  const { dependencies, name } = app;
  const { installed } = state;

  const canUpdate = installed.some(
    ({ name, updated }) => name === app.name && !updated,
  );

  const needsDependencies =
    dependencies &&
    dependencies.some(dep => installed.every(app => app.name !== dep));

  const installApp = useCallback(() => {
    if (needsDependencies) setAppInstallWithDependencies(app);
    else dispatch({ type: "install", name });
  }, [dispatch, name]);

  return (
    <Button
      disabled={notEnoughMemoryToInstall}
      useTouchable
      type={canUpdate ? "tertiary" : "lightPrimary"}
      outline={!canUpdate}
      title={<Trans i18nKey={canUpdate ? "common.update" : "common.install"} />}
      containerStyle={styles.appButton}
      titleStyle={styles.appStateText}
      onPress={installApp}
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
    alignItems: "flex-start",
    height: 38,
    paddingHorizontal: 10,
    paddingVertical: 12,
    zIndex: 5,
  },
});

export default memo(AppInstallButton);
