import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";

import { useAppUninstallNeedsDeps } from "@ledgerhq/live-common/apps/react";

import type { App } from "@ledgerhq/types-live";
import type { Action, State } from "@ledgerhq/live-common/apps/index";

import styled from "styled-components/native";
import { IconsLegacy, Box } from "@ledgerhq/native-ui";
import { useSetAppsWithDependenciesToInstallUninstall } from "../AppsInstallUninstallWithDependenciesContext";

type Props = {
  app: App;
  state: State;
  dispatch: (_: Action) => void;
  size?: number;
};

const ButtonContainer = styled(Box).attrs({
  borderWidth: 1,
  alignItems: "center",
  justifyContent: "center",
})``;

const AppUninstallButton = ({ app, state, dispatch, size = 48 }: Props) => {
  const { name } = app;

  const needsDependencies = useAppUninstallNeedsDeps(state, app);

  const { setAppWithDependentsToUninstall: setAppUninstallWithDependencies } =
    useSetAppsWithDependenciesToInstallUninstall();

  const uninstallApp = useCallback(() => {
    if (needsDependencies && setAppUninstallWithDependencies)
      setAppUninstallWithDependencies(needsDependencies);
    else dispatch({ type: "uninstall", name });
  }, [needsDependencies, setAppUninstallWithDependencies, dispatch, name]);

  return (
    <TouchableOpacity onPress={uninstallApp} testID={`app-${name}-installed`}>
      <ButtonContainer width={size} height={size} borderRadius={size} borderColor="error.c50">
        <IconsLegacy.TrashMedium size={size * 0.375} color="error.c50" />
      </ButtonContainer>
    </TouchableOpacity>
  );
};

export default AppUninstallButton;
