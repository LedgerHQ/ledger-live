import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";

import { useAppUninstallNeedsDeps } from "@ledgerhq/live-common/apps/react";

import type { App } from "@ledgerhq/live-common/types/manager";
import type { Action, State } from "@ledgerhq/live-common/apps/index";

import styled from "styled-components/native";
import { Icons, Box } from "@ledgerhq/native-ui";

type Props = {
  app: App,
  state: State,
  dispatch: (action: Action) => void,
  setAppUninstallWithDependencies: (params: { dependents: App[], app: App }) => void,
  size: number,
};

const ButtonContainer = styled(Box).attrs({
  borderWidth: 1,
  alignItems: "center",
  justifyContent: "center",
})``;

const AppUninstallButton = ({
  app,
  state,
  dispatch,
  setAppUninstallWithDependencies,
  size = 48,
}: Props) => {
  const { name } = app;

  const needsDependencies = useAppUninstallNeedsDeps(state, app);

  const uninstallApp = useCallback(() => {
    if (needsDependencies && setAppUninstallWithDependencies)
      setAppUninstallWithDependencies(needsDependencies);
    else dispatch({ type: "uninstall", name });
  }, [needsDependencies, setAppUninstallWithDependencies, dispatch, name]);

  return (
    <TouchableOpacity onPress={uninstallApp}>
      <ButtonContainer width={size} height={size} borderRadius={size} borderColor="error.c100">
        <Icons.TrashMedium size={size * 0.375} color="error.c100"/>
      </ButtonContainer>
    </TouchableOpacity>
  );
};

export default AppUninstallButton;
