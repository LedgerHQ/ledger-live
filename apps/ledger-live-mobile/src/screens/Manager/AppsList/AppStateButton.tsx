import React, { useMemo, memo } from "react";
import type { App } from "@ledgerhq/types-live";
import type { Action, State } from "@ledgerhq/live-common/apps/index";
import { Flex } from "@ledgerhq/native-ui";

import styled from "styled-components/native";
import AppInstallButton from "./AppInstallButton";
import AppUninstallButton from "./AppUninstallButton";
import AppUpdateButton from "./AppUpdateButton";

import AppProgressButton from "./AppProgressButton";

type Props = {
  app: App;
  state: State;
  dispatch: (_: Action) => void;
  notEnoughMemoryToInstall: boolean;
  isInstalled: boolean;
  setAppInstallWithDependencies: (_: { app: App; dependencies: App[] }) => void;
  setAppUninstallWithDependencies: (_: { dependents: App[]; app: App }) => void;
  storageWarning: (appName: string) => void;
};

const Container = styled(Flex).attrs({
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-end",
})``;

const AppStateButton = ({
  app,
  state,
  dispatch,
  notEnoughMemoryToInstall,
  isInstalled,
  setAppInstallWithDependencies,
  setAppUninstallWithDependencies,
  storageWarning,
}: Props) => {
  const { installed, installQueue, uninstallQueue, updateAllQueue } = state;
  const { name } = app;

  const installing = useMemo(
    () => installQueue.includes(name),
    [installQueue, name],
  );

  const updating = useMemo(
    () => updateAllQueue.includes(name),
    [updateAllQueue, name],
  );

  const uninstalling = useMemo(
    () => uninstallQueue.includes(name),
    [uninstallQueue, name],
  );

  const canUpdate = useMemo(
    () => installed.some(({ name, updated }) => name === app.name && !updated),
    [app.name, installed],
  );

  const renderAppState = () => {
    switch (true) {
      case installing:
        return <AppProgressButton state={state} name={name} installing />;
      case uninstalling:
        return <AppProgressButton state={state} name={name} />;
      case updating:
        return <AppProgressButton state={state} name={name} updating />;
      case canUpdate:
        return <AppUpdateButton app={app} state={state} dispatch={dispatch} />;
      case isInstalled:
        return (
          <AppUninstallButton
            app={app}
            state={state}
            dispatch={dispatch}
            setAppUninstallWithDependencies={setAppUninstallWithDependencies}
          />
        );
      default:
        return (
          <AppInstallButton
            state={state}
            dispatch={dispatch}
            app={app}
            notEnoughMemoryToInstall={notEnoughMemoryToInstall}
            setAppInstallWithDependencies={setAppInstallWithDependencies}
            storageWarning={storageWarning}
          />
        );
    }
  };

  return <Container>{renderAppState()}</Container>;
};

export default memo(AppStateButton);
